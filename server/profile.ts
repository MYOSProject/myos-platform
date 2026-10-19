// Perfil del negocio: lo que MYOS "sabe" de la persona usuaria. Alimenta al chatbot, a los sitios y a las publicaciones.
import type { BusinessProfile } from './types.js';
import { safeColor } from './gemini.js';
import { safeImageSrc } from './siteHtml.js';

export const TEXT_FIELDS = [
  'business_name', 'what_they_do', 'industry', 'audience', 'location', 'value_proposition', 'offers',
  'tone', 'goals', 'channels', 'phone', 'email', 'address', 'hours', 'website', 'notes'
] as const;
export type TextField = (typeof TEXT_FIELDS)[number];

export const FIELD_LABELS: Record<TextField, string> = {
  business_name: 'Nombre del negocio',
  what_they_do: 'A qué se dedica',
  industry: 'Giro',
  audience: 'Público objetivo',
  location: 'Ubicación / zona de servicio',
  value_proposition: 'Qué lo hace diferente',
  offers: 'Productos, servicios u ofertas',
  tone: 'Tono de comunicación',
  goals: 'Objetivos',
  channels: 'Canales donde quiere publicar',
  phone: 'Teléfono / WhatsApp',
  email: 'Correo de contacto',
  address: 'Dirección',
  hours: 'Horario',
  website: 'Sitio web actual',
  notes: 'Otras notas'
};

/** Lo mínimo para que el asistente pueda crear contenido sin inventar. */
export const ESSENTIAL: TextField[] = ['business_name', 'what_they_do', 'audience', 'location', 'tone', 'goals'];

export function emptyProfile(): BusinessProfile {
  const p: any = { brand_colors: null, logo: null };
  for (const f of TEXT_FIELDS) p[f] = '';
  return p as BusinessProfile;
}

const TAG = /<[^>]*>/g;
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const clean = (v: unknown, max = 700) => (typeof v === 'string' ? v.replace(TAG, '').replace(CTRL, '').replace(/[ \t]+/g, ' ').trim().slice(0, max) : '');

/**
 * Aplica un cambio al perfil. Solo campos conocidos; texto plano; cadena vacía = "sin cambio" cuando viene del modelo.
 * Devuelve el perfil nuevo y los campos que cambiaron.
 */
export function mergeProfile(current: BusinessProfile | undefined, patch: any, opts: { allowClear?: boolean } = {}): { profile: BusinessProfile; changed: TextField[] } {
  const base = { ...emptyProfile(), ...(current || {}) } as BusinessProfile;
  const changed: TextField[] = [];
  if (patch && typeof patch === 'object') {
    for (const f of TEXT_FIELDS) {
      if (!(f in patch)) continue;
      const v = clean(patch[f], f === 'notes' || f === 'offers' ? 1200 : 400);
      if (!v && !opts.allowClear) continue;
      if (v !== base[f]) {
        (base as any)[f] = v;
        changed.push(f);
      }
    }
    if ('brand_colors' in patch) {
      const c = patch.brand_colors;
      base.brand_colors = c && typeof c === 'object' && c.primary ? { primary: safeColor(c.primary, '#111827'), secondary: safeColor(c.secondary, '#E2554F'), accent: safeColor(c.accent, '#8CCFD9') } : null;
    }
    if ('logo' in patch) base.logo = safeImageSrc(patch.logo) || null;
  }
  base.updated_at = new Date().toISOString();
  return { profile: base, changed };
}

export function missingEssentials(p: BusinessProfile | undefined): TextField[] {
  return ESSENTIAL.filter((f) => !(p as any)?.[f]?.trim());
}

export function completeness(p: BusinessProfile | undefined): number {
  const filled = ESSENTIAL.filter((f) => (p as any)?.[f]?.trim()).length;
  return Math.round((filled / ESSENTIAL.length) * 100);
}

/** Texto del perfil para el prompt. Es DATO del usuario, no instrucciones. */
export function profileForPrompt(p: BusinessProfile | undefined): string {
  const prof = p || emptyProfile();
  const lines = TEXT_FIELDS.map((f) => `- ${FIELD_LABELS[f]}: ${(prof as any)[f] || '(sin dato)'}`);
  if (prof.brand_colors) lines.push(`- Colores de marca: ${prof.brand_colors.primary}, ${prof.brand_colors.secondary}, ${prof.brand_colors.accent}`);
  return lines.join('\n');
}

/** Descripción del negocio lista para el generador de sitios. */
export function composeSiteBrief(p: BusinessProfile | undefined, request: string): string {
  const prof = p || emptyProfile();
  const parts: string[] = [];
  const add = (label: string, v: string) => v && parts.push(`${label}: ${v}`);
  add('Nombre del negocio', prof.business_name);
  add('A qué se dedica', prof.what_they_do);
  add('Giro', prof.industry);
  add('Público objetivo', prof.audience);
  add('Ubicación', prof.location);
  add('Qué lo hace diferente', prof.value_proposition);
  add('Productos/servicios/ofertas', prof.offers);
  add('Tono de comunicación', prof.tone);
  add('Objetivos', prof.goals);
  add('Teléfono', prof.phone);
  add('Correo', prof.email);
  add('Dirección', prof.address);
  add('Horario', prof.hours);
  if (prof.brand_colors) parts.push(`Colores de marca: ${prof.brand_colors.primary}, ${prof.brand_colors.secondary}, ${prof.brand_colors.accent}`);
  add('Petición específica', request);
  return parts.join('\n').slice(0, 3900);
}
