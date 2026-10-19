// Flujo de aprobación de publicaciones en redes.
//
//   DRAFT ──submit──▶ PENDING_APPROVAL ──approve──▶ APPROVED ──publish──▶ PUBLISHED
//     ▲                    │ reject                    │ reject / fallo        (terminal)
//     └──── edit ──────────┴───────── REJECTED ◀───────┘  FAILED (reintentable)
//
// Garantías (regla no negociable del proyecto):
//  1. Nada se publica sin pasar por APPROVED, y APPROVED solo lo pone un aprobador identificado.
//  2. Al aprobar se guarda la huella SHA-256 de lo que se publicaría (texto final, imagen, enlace,
//     plataforma). Al publicar se recalcula: si no coincide, se rechaza. Lo aprobado ES lo publicado.
//  3. Editar una publicación aprobada borra la aprobación y la regresa a borrador.
//  4. Cada transición queda en el historial con quién, cuándo y por qué.
import crypto from 'crypto';
import type { AuthUser, ContentItem, SocialPlatform, SocialPost } from './types.js';
import { HttpError } from './http.js';
import { audit, stableStringify } from './content.js';
import { composeMessage, publish, publisherConfig } from './publisher.js';
import type { Store } from './store.js';

const LIMITS = { facebook: 5000, instagram: 2200 } as const;

function who(user: AuthUser) {
  return `${user.name} <${user.email}>`;
}

export function postHash(p: SocialPost): string {
  return crypto
    .createHash('sha256')
    .update(stableStringify({ platform: p.platform, message: composeMessage(p), image_url: p.image_url, link_url: p.link_url }))
    .digest('hex');
}

function httpsUrl(v: unknown): string {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  if (!s) return '';
  if (!/^https:\/\/[^\s"'<>]+$/i.test(s) || s.length > 2000) throw new HttpError(400, 'BAD_URL', 'Las URL deben comenzar con https://');
  return s;
}

export function validatePost(p: SocialPost): string[] {
  const problems: string[] = [];
  const message = composeMessage(p);
  if (!p.copy.trim()) problems.push('El texto de la publicación está vacío.');
  if (message.length > LIMITS[p.platform]) problems.push(`El texto final mide ${message.length} caracteres y ${p.platform === 'instagram' ? 'Instagram' : 'Facebook'} permite ${LIMITS[p.platform]}.`);
  if (p.platform === 'instagram') {
    if (!p.image_url) problems.push('Instagram exige una imagen (URL https pública).');
    const tags = (p.hashtags.match(/#/g) || []).length;
    if (tags > 30) problems.push('Instagram permite máximo 30 hashtags.');
  }
  if (p.image_url && !/^https:\/\//i.test(p.image_url)) problems.push('La imagen debe ser una URL https pública (Meta no acepta archivos locales).');
  return problems;
}

export interface PostInput {
  platform?: SocialPlatform;
  copy?: string;
  hashtags?: string;
  cta?: string;
  link_url?: string;
  image_url?: string;
  image_prompt?: string;
  scheduled_at?: string | null;
  site_id?: number | null;
}

function cleanText(v: unknown, max: number): string {
  return typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max) : '';
}

function cleanSchedule(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new HttpError(400, 'BAD_DATE', 'Fecha programada inválida.');
  return d.toISOString();
}

export function createPost(store: Store, input: PostInput, user: AuthUser, site?: ContentItem | null): SocialPost {
  if (input.platform !== 'facebook' && input.platform !== 'instagram') throw new HttpError(400, 'BAD_PLATFORM', 'La plataforma debe ser facebook o instagram.');
  const now = new Date().toISOString();
  const post: SocialPost = {
    id: store.nextId('social'),
    site_id: site?.id ?? null,
    site_name: site ? site.content?.site_name || site.title : undefined,
    platform: input.platform,
    copy: cleanText(input.copy, 5000),
    hashtags: cleanText(input.hashtags, 600),
    cta: cleanText(input.cta, 40),
    link_url: httpsUrl(input.link_url),
    image_url: httpsUrl(input.image_url),
    image_prompt: cleanText(input.image_prompt, 500),
    scheduled_at: cleanSchedule(input.scheduled_at),
    status: 'DRAFT',
    created_at: now,
    created_by: who(user),
    updated_at: now,
    approved_at: null,
    approved_by: null,
    approved_by_email: null,
    approved_hash: null,
    history: []
  };
  audit(post, { by: who(user), action: 'create', to: 'DRAFT' });
  store.social.unshift(post);
  store.save();
  return post;
}

/** Crea los borradores de Facebook e Instagram a partir de lo que generó la IA para un sitio. */
export function createDraftsFromSite(store: Store, site: ContentItem, user: AuthUser, baseUrl: string): SocialPost[] {
  const sp = site.content?.social_posts || {};
  const link = site.status === 'APPROVED' || site.status === 'PUBLISHED' ? `${baseUrl.replace(/\/+$/, '')}/site/${site.id}` : '';
  const img = '';
  const made: SocialPost[] = [];
  if (sp.facebook?.copy) {
    made.push(createPost(store, { platform: 'facebook', copy: sp.facebook.copy, cta: sp.facebook.cta, link_url: link && baseUrl.startsWith('https://') ? link : '', image_url: img, image_prompt: site.content?.prompt_imagen, site_id: site.id }, user, site));
  }
  if (sp.instagram?.copy) {
    made.push(createPost(store, { platform: 'instagram', copy: sp.instagram.copy, hashtags: sp.instagram.hashtags, image_prompt: site.content?.prompt_imagen, site_id: site.id }, user, site));
  }
  if (!made.length) throw new HttpError(422, 'NO_SOCIAL_CONTENT', 'Este sitio no tiene texto de redes sociales que convertir en publicaciones.');
  return made;
}

export function editPost(store: Store, post: SocialPost, input: PostInput, user: AuthUser): SocialPost {
  if (post.status === 'PUBLISHED') throw new HttpError(409, 'BAD_STATE', 'Una publicación ya publicada no se puede editar.');
  const before = postHash(post);
  if (input.copy !== undefined) post.copy = cleanText(input.copy, 5000);
  if (input.hashtags !== undefined) post.hashtags = cleanText(input.hashtags, 600);
  if (input.cta !== undefined) post.cta = cleanText(input.cta, 40);
  if (input.link_url !== undefined) post.link_url = httpsUrl(input.link_url);
  if (input.image_url !== undefined) post.image_url = httpsUrl(input.image_url);
  if (input.image_prompt !== undefined) post.image_prompt = cleanText(input.image_prompt, 500);
  if (input.scheduled_at !== undefined) post.scheduled_at = cleanSchedule(input.scheduled_at);
  post.updated_at = new Date().toISOString();
  const after = postHash(post);
  if (before !== after && post.status !== 'DRAFT') {
    const from = post.status;
    post.status = 'DRAFT';
    post.approved_at = null;
    post.approved_by = null;
    post.approved_by_email = null;
    post.approved_hash = null;
    post.publish_result = null;
    audit(post, { by: who(user), action: 'edit', from, to: 'DRAFT', note: 'Contenido modificado: la aprobación anterior quedó sin efecto.' });
  } else if (before !== after) {
    audit(post, { by: who(user), action: 'edit' });
  }
  store.save();
  return post;
}

export function submitPost(store: Store, post: SocialPost, user: AuthUser): SocialPost {
  if (post.status !== 'DRAFT' && post.status !== 'REJECTED') {
    throw new HttpError(409, 'BAD_STATE', `Solo se puede enviar a aprobación un borrador (estado actual: ${post.status}).`);
  }
  const problems = validatePost(post);
  if (problems.length) throw new HttpError(422, 'INVALID_POST', problems[0], problems);
  const from = post.status;
  post.status = 'PENDING_APPROVAL';
  post.rejected_reason = null;
  post.updated_at = new Date().toISOString();
  audit(post, { by: who(user), action: 'submit', from, to: 'PENDING_APPROVAL' });
  store.save();
  return post;
}

export function approvePost(store: Store, post: SocialPost, user: AuthUser, body: { confirm_review?: boolean }): SocialPost {
  if (post.status !== 'PENDING_APPROVAL') {
    throw new HttpError(409, 'BAD_STATE', `Solo se puede aprobar una publicación pendiente (estado actual: ${post.status}).`);
  }
  if (body?.confirm_review !== true) throw new HttpError(400, 'REVIEW_NOT_CONFIRMED', 'Debes confirmar que revisaste el texto y la imagen antes de aprobar.');
  const problems = validatePost(post);
  if (problems.length) throw new HttpError(422, 'INVALID_POST', problems[0], problems);
  const now = new Date().toISOString();
  post.status = 'APPROVED';
  post.approved_at = now;
  post.approved_by = user.name;
  post.approved_by_email = user.email;
  post.approved_hash = postHash(post);
  post.updated_at = now;
  audit(post, { by: who(user), action: 'approve', from: 'PENDING_APPROVAL', to: 'APPROVED', note: `Revisión confirmada. Huella ${post.approved_hash.slice(0, 12)}` });
  store.save();
  return post;
}

export function rejectPost(store: Store, post: SocialPost, user: AuthUser, reason: string): SocialPost {
  if (post.status !== 'PENDING_APPROVAL' && post.status !== 'APPROVED' && post.status !== 'FAILED') {
    throw new HttpError(409, 'BAD_STATE', `No se puede rechazar una publicación en estado ${post.status}.`);
  }
  const from = post.status;
  post.status = 'REJECTED';
  post.rejected_reason = cleanText(reason, 500) || null;
  post.approved_at = null;
  post.approved_by = null;
  post.approved_by_email = null;
  post.approved_hash = null;
  post.updated_at = new Date().toISOString();
  audit(post, { by: who(user), action: 'reject', from, to: 'REJECTED', note: post.rejected_reason || undefined });
  store.save();
  return post;
}

const publishing = new Set<number>();

export async function publishPost(store: Store, post: SocialPost, user: AuthUser): Promise<SocialPost> {
  if (post.status !== 'APPROVED' && post.status !== 'FAILED') {
    throw new HttpError(409, 'NOT_APPROVED', `Solo se publica una publicación APROBADA (estado actual: ${post.status}). Nada se publica sin aprobación humana.`);
  }
  if (!post.approved_hash || !post.approved_by_email) {
    throw new HttpError(409, 'NO_APPROVAL_RECORD', 'La publicación no tiene registro de aprobación.');
  }
  if (post.approved_hash !== postHash(post)) {
    throw new HttpError(409, 'CONTENT_CHANGED', 'El contenido cambió después de aprobarse. Vuelve a enviarlo a aprobación.');
  }
  const problems = validatePost(post);
  if (problems.length) throw new HttpError(422, 'INVALID_POST', problems[0], problems);
  if (publishing.has(post.id)) throw new HttpError(409, 'IN_PROGRESS', 'Esta publicación ya se está enviando.');

  publishing.add(post.id);
  try {
    const result = await publish(post);
    const mode = publisherConfig(post.platform).mode;
    post.updated_at = new Date().toISOString();
    if (result.mode === 'dry-run') {
      post.last_dry_run = result;
      audit(post, { by: who(user), action: 'dry_run', note: result.note });
    } else if (result.ok) {
      post.status = 'PUBLISHED';
      post.published_at = result.at;
      post.publish_result = result;
      post.last_dry_run = null;
      audit(post, { by: who(user), action: 'publish', from: 'APPROVED', to: 'PUBLISHED', note: `Vía ${mode}${result.external_id ? ` · id ${result.external_id}` : ''}` });
    } else {
      post.status = 'FAILED';
      post.publish_result = result;
      audit(post, { by: who(user), action: 'publish_failed', to: 'FAILED', note: result.error });
    }
    store.save();
    return post;
  } finally {
    publishing.delete(post.id);
  }
}

export function deletePost(store: Store, post: SocialPost, user: AuthUser): void {
  if (post.status !== 'DRAFT' && post.status !== 'REJECTED') {
    throw new HttpError(409, 'BAD_STATE', 'Solo se pueden eliminar borradores o publicaciones rechazadas.');
  }
  store.social = store.social.filter((p) => p.id !== post.id);
  console.log(`[social] ${who(user)} eliminó la publicación #${post.id}`);
  store.save();
}
