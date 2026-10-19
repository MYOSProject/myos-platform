// Flujo de aprobación de sitios web.
//
// Estados: PENDING → APPROVED | REJECTED.  Cualquier edición de un sitio APPROVED/REJECTED lo
// regresa a PENDING y borra la aprobación, y el sitio solo se sirve públicamente si la huella
// SHA-256 del contenido coincide con la que firmó el aprobador. Cada cambio queda en `history`.
import crypto from 'crypto';
import type { AuditEvent, AuthUser, ContentItem, GeneratedWebsite } from './types.js';
import { HttpError } from './http.js';
import { safeColor } from './gemini.js';
import { safeImageSrc } from './siteHtml.js';
import { ICON_NAMES } from './icons.js';

// ---------------------------------------------------------------------------------------------
// Huella del contenido
// ---------------------------------------------------------------------------------------------
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .filter((k) => obj[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

/** full_html y drive_files se derivan del resto: no forman parte de lo aprobado. */
export function siteHash(content: any): string {
  const { full_html: _h, drive_files: _d, ...rest } = content || {};
  return crypto.createHash('sha256').update(stableStringify(rest)).digest('hex');
}

export function audit(item: { history: AuditEvent[] }, event: Omit<AuditEvent, 'at'>): void {
  item.history.push({ at: new Date().toISOString(), ...event });
}

// ---------------------------------------------------------------------------------------------
// Sanitización de ediciones humanas
// ---------------------------------------------------------------------------------------------
const EDITABLE = [
  'titulo', 'site_name', 'industry', 'tagline', 'brand_colors', 'hero', 'services', 'about', 'blog_posts',
  'contact', 'social_posts', 'resumen_web', 'copy_redes', 'prompt_imagen', 'review_notes', 'custom_logo',
  'hero_image', 'custom_photos', 'design_theme'
] as const;

const THEMES = ['dark-modern', 'light-clean', 'luxury-gold'];
const IMAGE_KEYS = new Set(['custom_logo', 'hero_image', 'image']);

function sanitizeValue(key: string, v: any, depth = 0): any {
  if (depth > 6) return undefined;
  if (v === null || v === undefined) return IMAGE_KEYS.has(key) ? null : undefined;
  if (IMAGE_KEYS.has(key)) return safeImageSrc(v) || null;
  if (typeof v === 'string') return v.slice(0, 12000);
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  if (Array.isArray(v)) {
    if (key === 'custom_photos') return v.map((x) => safeImageSrc(x)).filter(Boolean).slice(0, 12);
    return v.slice(0, 50).map((x) => sanitizeValue(key, x, depth + 1)).filter((x) => x !== undefined);
  }
  if (typeof v === 'object') {
    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      const s = sanitizeValue(k, val, depth + 1);
      if (s !== undefined) out[k] = s;
    }
    return out;
  }
  return undefined;
}

export function sanitizeEdit(patch: any): Partial<GeneratedWebsite> {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new HttpError(400, 'BAD_CONTENT', 'El contenido a guardar es inválido.');
  const out: Record<string, any> = {};
  for (const key of EDITABLE) {
    if (!(key in patch)) continue;
    let v = sanitizeValue(key, patch[key]);
    if (v === undefined) continue;
    if (key === 'brand_colors') {
      v = {
        primary: safeColor(v.primary, '#e8504a'),
        secondary: safeColor(v.secondary, '#0f1c3c'),
        accent: safeColor(v.accent, '#f4b6b3')
      };
    }
    if (key === 'design_theme' && !THEMES.includes(v)) continue;
    if (key === 'services' && Array.isArray(v)) {
      v = v.map((s: any) => ({ ...s, icon: ICON_NAMES.includes(s?.icon) ? s.icon : 'Sparkles' }));
    }
    out[key] = v;
  }
  return out as Partial<GeneratedWebsite>;
}

// ---------------------------------------------------------------------------------------------
// Transiciones
// ---------------------------------------------------------------------------------------------
function who(user: AuthUser): string {
  return `${user.name} <${user.email}>`;
}

export function titleFor(content: any, fallback = 'Sitio web'): string {
  return content?.site_name || content?.titulo || fallback;
}

export function approveContent(item: ContentItem, user: AuthUser, body: { confirm_review?: boolean; acknowledge_fallback?: boolean }): ContentItem {
  if (item.status !== 'PENDING') {
    throw new HttpError(409, 'BAD_STATE', `Solo se puede aprobar un sitio PENDIENTE (estado actual: ${item.status}).`);
  }
  if (body?.confirm_review !== true) {
    throw new HttpError(400, 'REVIEW_NOT_CONFIRMED', 'Debes confirmar que revisaste el contenido antes de aprobar.');
  }
  if ((item.ai?.source === 'fallback' || item.ai?.source === 'seed') && body?.acknowledge_fallback !== true) {
    throw new HttpError(
      409,
      'FALLBACK_NOT_ACKNOWLEDGED',
      item.ai?.source === 'fallback'
        ? 'Este sitio salió de una plantilla de respaldo, NO de Gemini. Confirma explícitamente que quieres aprobarlo así.'
        : 'Este es un sitio de ejemplo. Confirma explícitamente que quieres aprobarlo.'
    );
  }
  const now = new Date().toISOString();
  const hash = siteHash(item.content);
  const from = item.status;
  item.status = 'APPROVED';
  item.approved_at = now;
  item.approved_by = user.name;
  item.approved_by_email = user.email;
  item.approved_hash = hash;
  item.rejected_reason = null;
  item.updated_at = now;
  audit(item, {
    by: who(user),
    action: 'approve',
    from,
    to: 'APPROVED',
    note: `Revisión confirmada. Huella ${hash.slice(0, 12)}${item.ai?.source !== 'gemini' ? ` · origen: ${item.ai?.source}` : ''}`
  });
  return item;
}

export function rejectContent(item: ContentItem, user: AuthUser, reason: string): ContentItem {
  if (item.status !== 'PENDING' && item.status !== 'APPROVED') {
    throw new HttpError(409, 'BAD_STATE', `No se puede rechazar un sitio en estado ${item.status}.`);
  }
  const from = item.status;
  item.status = 'REJECTED';
  item.rejected_reason = reason.slice(0, 500) || null;
  item.approved_at = null;
  item.approved_by = null;
  item.approved_by_email = null;
  item.approved_hash = null;
  item.updated_at = new Date().toISOString();
  audit(item, { by: who(user), action: 'reject', from, to: 'REJECTED', note: reason.slice(0, 500) });
  return item;
}

/** Aplica una edición humana. Si el sitio estaba aprobado, la aprobación se invalida. */
export function editContent(item: ContentItem, patch: any, user: AuthUser): ContentItem {
  const clean = sanitizeEdit(patch);
  const before = siteHash(item.content);
  item.content = { ...(item.content || {}), ...clean };
  const after = siteHash(item.content);
  item.title = titleFor(item.content, item.title);
  item.body_text = item.content.resumen_web || item.body_text;
  item.updated_at = new Date().toISOString();
  if (before === after) return item;

  const from = item.status;
  if (item.status === 'APPROVED' || item.status === 'PUBLISHED' || item.status === 'REJECTED') {
    item.status = 'PENDING';
    item.approved_at = null;
    item.approved_by = null;
    item.approved_by_email = null;
    item.approved_hash = null;
    audit(item, { by: who(user), action: 'edit', from, to: 'PENDING', note: 'Contenido modificado: la aprobación anterior quedó sin efecto.' });
  } else {
    audit(item, { by: who(user), action: 'edit', note: 'Contenido modificado.' });
  }
  return item;
}

/** ¿Se puede servir públicamente? Solo si está aprobado Y lo aprobado es lo que hay. */
export function isPubliclyServable(item: ContentItem): boolean {
  return (item.status === 'APPROVED' || item.status === 'PUBLISHED') && Boolean(item.approved_hash) && item.approved_hash === siteHash(item.content);
}
