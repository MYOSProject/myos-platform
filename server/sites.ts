// Crear o ajustar un sitio con Gemini. Lo usan /api/generate y el chatbot.
// Todo lo que sale de aquí nace PENDIENTE de aprobación humana.
import type { AiMeta, AuthUser, ContentItem } from './types.js';
import { AiFailure, generateSite, normalizeSite, safeColor } from './gemini.js';
import { generateSmartContent } from './fallbackSite.js';
import { safeImageSrc } from './siteHtml.js';
import { audit, titleFor } from './content.js';
import { HttpError } from './http.js';
import type { Store } from './store.js';

const THEMES = ['dark-modern', 'light-clean', 'luxury-gold'];

export const aiStatusFor = (code: string) => (code === 'NO_API_KEY' ? 503 : code === 'QUOTA' ? 429 : code === 'SAFETY_BLOCK' ? 422 : 502);

export interface SiteInput {
  brief: string;
  refineOfId?: number | null;
  allowFallback?: boolean;
  customLogo?: unknown;
  heroImage?: unknown;
  customColors?: { primary?: string; secondary?: string; accent?: string } | null;
  designTheme?: string;
}

export async function createOrRefineSite(store: Store, user: AuthUser, input: SiteInput): Promise<{ item: ContentItem; ai: AiMeta; created: boolean }> {
  const brief = input.brief.trim();
  const previous = input.refineOfId ? store.contents.find((c) => c.id === input.refineOfId) || null : null;
  if (input.refineOfId && !previous) throw new HttpError(404, 'NOT_FOUND', `No existe el sitio #${input.refineOfId}.`);
  const previousSite = previous?.content || null;

  let site;
  let ai: AiMeta;
  try {
    ({ site, ai } = await generateSite({ brief, previousSite }));
  } catch (e: any) {
    if (!(e instanceof AiFailure)) throw e;
    console.error(`[ai] ${e.code}: ${e.message} · intentos: ${JSON.stringify(e.ai.attempts)}`);
    if (!input.allowFallback) {
      throw new HttpError(aiStatusFor(e.code), 'AI_FAILED', e.message, {
        ai_code: e.code,
        hint: e.ai.error?.hint,
        attempts: e.ai.attempts,
        can_fallback: true
      });
    }
    // Respaldo EXPLÍCITO y marcado: nunca se hace pasar por IA.
    site = normalizeSite(generateSmartContent(brief, { previousSite }));
    site.review_notes = [
      'Plantilla de respaldo: NO fue generada por Gemini. Textos, cifras y datos de contacto son de ejemplo.',
      ...(site.review_notes || [])
    ];
    ai = { ...e.ai, source: 'fallback' as const };
  }

  // Conserva la personalización previa y aplica la que se envía ahora.
  const keep = previousSite
    ? {
        custom_logo: previousSite.custom_logo ?? null,
        hero_image: previousSite.hero_image ?? null,
        custom_photos: previousSite.custom_photos,
        design_theme: previousSite.design_theme,
        about: previousSite.about?.image ? { image: previousSite.about.image } : undefined
      }
    : {};
  const content: any = { ...site, ...keep, about: { ...site.about, ...(keep as any).about } };
  const logo = safeImageSrc(input.customLogo);
  if (logo) content.custom_logo = logo;
  const hero = safeImageSrc(input.heroImage);
  if (hero) content.hero_image = hero;
  if (input.customColors?.primary) {
    content.brand_colors = {
      primary: safeColor(input.customColors.primary, content.brand_colors.primary),
      secondary: safeColor(input.customColors.secondary, content.brand_colors.secondary),
      accent: safeColor(input.customColors.accent, content.brand_colors.accent)
    };
  }
  if (input.designTheme && THEMES.includes(input.designTheme)) content.design_theme = input.designTheme;
  if (!content.design_theme) content.design_theme = 'dark-modern';

  const slug = (content.site_name || 'sitio').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'sitio';
  content.drive_files = {
    pages_file: `/Sitio_Web/Paginas/${slug}_index.html`,
    blog_file: `/Sitio_Web/Blog/articulos_${slug}.md`,
    social_file: `/Redes_Sociales/Para_Publicar/campana_${slug}.json`,
    brand_file: '/Marca/logo_oficial.png'
  };

  const now = new Date().toISOString();
  const by = `${user.name} <${user.email}>`;
  let item: ContentItem;
  if (previous) {
    const from = previous.status;
    item = previous;
    item.content = content;
    item.title = titleFor(content, item.title);
    item.body_text = content.resumen_web;
    item.brief = brief;
    item.ai = ai;
    item.status = 'PENDING';
    item.approved_at = null;
    item.approved_by = null;
    item.approved_by_email = null;
    item.approved_hash = null;
    item.updated_at = now;
    audit(item, { by, action: 'ai_refine', from, to: 'PENDING', note: `Ajuste con ${ai.source === 'gemini' ? ai.model : 'plantilla de respaldo'}: ${brief.slice(0, 160)}` });
  } else {
    const id = store.nextId('content');
    item = {
      id,
      title: titleFor(content),
      slug: `propuesta-${id}`,
      category: 'PÁGINA WEB / REDES',
      // REGLA NO NEGOCIABLE: todo lo generado nace PENDIENTE de aprobación humana.
      status: 'PENDING',
      brief,
      body_text: content.resumen_web,
      created_at: now,
      created_by: by,
      project_id: user.project_id ?? null,
      drive_file_id: `drive_draft_${id}`,
      ai,
      content,
      history: []
    };
    audit(item, { by, action: 'ai_generate', to: 'PENDING', note: ai.source === 'gemini' ? `Gemini (${ai.model})` : 'Plantilla de respaldo (NO IA)' });
    store.contents.unshift(item);
  }
  store.save();
  return { item, ai, created: !previous };
}
