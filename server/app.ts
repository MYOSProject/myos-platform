import './env.js'; // debe ir primero: carga .env y frontend/.env
import crypto from 'crypto';
import express from 'express';
import type { Request, Response } from 'express';
import { ENV_FILES_LOADED } from './env.js';
import { authMode, approverPolicy, firebaseProjectId, rateLimit, requireApprover, requireAuth } from './auth.js';
import { AiFailure, getAiStatus, generateSite, pingGemini, normalizeSite, safeColor } from './gemini.js';
import { generateSmartContent } from './fallbackSite.js';
import { generateStandaloneHtml, safeImageSrc } from './siteHtml.js';
import { getStore } from './store.js';
import { HttpError, errorHandler, intParam, wrap } from './http.js';
import {
  approveContent,
  audit,
  editContent,
  isPubliclyServable,
  rejectContent,
  titleFor
} from './content.js';
import {
  approvePost,
  createDraftsFromSite,
  createPost,
  deletePost,
  editPost,
  publishPost,
  rejectPost,
  submitPost,
  validatePost
} from './social.js';
import { publisherStatus } from './publisher.js';
import type { AuthUser, ContentItem, SocialPost } from './types.js';

const THEMES = ['dark-modern', 'light-clean', 'luxury-gold'];

function baseUrl(req: Request): string {
  const configured = process.env.PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function renderPreview(item: ContentItem, opts: { nonce?: string; preview?: boolean } = {}): string {
  return generateStandaloneHtml(item.content, {
    preview: opts.preview ?? true,
    siteId: item.id,
    apiBase: process.env.PUBLIC_BASE_URL?.trim() || '',
    nonce: opts.nonce
  });
}

/** Resumen liviano para listados (sin imágenes en base64 ni historial). */
function summary(item: ContentItem) {
  const c = item.content || {};
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    category: item.category,
    status: item.status,
    body_text: item.body_text,
    created_at: item.created_at,
    created_by: item.created_by,
    updated_at: item.updated_at,
    approved_at: item.approved_at,
    approved_by: item.approved_by,
    approved_by_email: item.approved_by_email,
    rejected_reason: item.rejected_reason,
    is_seed: item.is_seed,
    ai: item.ai ? { source: item.ai.source, model: item.ai.model, error: item.ai.error } : undefined,
    review_notes: c.review_notes || [],
    content: {
      site_name: c.site_name,
      industry: c.industry,
      tagline: c.tagline,
      brand_colors: c.brand_colors,
      resumen_web: c.resumen_web,
      design_theme: c.design_theme,
      has_logo: Boolean(c.custom_logo)
    }
  };
}

function detail(item: ContentItem) {
  return {
    ...item,
    content: { ...item.content, full_html: renderPreview(item) }
  };
}

function summarizePost(p: SocialPost) {
  return { ...p, problems: validatePost(p) };
}

function findContent(id: number): ContentItem {
  const item = getStore().contents.find((c) => c.id === id);
  if (!item) throw new HttpError(404, 'NOT_FOUND', `No existe el sitio #${id}.`);
  return item;
}

function findPost(id: number): SocialPost {
  const post = getStore().social.find((p) => p.id === id);
  if (!post) throw new HttpError(404, 'NOT_FOUND', `No existe la publicación #${id}.`);
  return post;
}

const aiStatusFor = (code: string) => (code === 'NO_API_KEY' ? 503 : code === 'QUOTA' ? 429 : code === 'SAFETY_BLOCK' ? 422 : 502);

const notFoundPage = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sitio no disponible</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f6f7fb;color:#0f1c3c;text-align:center;padding:24px}main{max-width:420px}h1{font-size:22px}p{color:#586178}</style></head>
<body><main><h1>Este sitio no está disponible</h1><p>Aún no ha sido aprobado o ya no existe.</p></main></body></html>`;

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '12mb' }));

  // Cabeceras de seguridad básicas
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // ---------------------------------------------------------------------------------------
  // Estado / diagnóstico
  // ---------------------------------------------------------------------------------------
  app.get('/api/health', (_req, res) => {
    const store = getStore();
    res.json({
      ok: true,
      time: new Date().toISOString(),
      ai: getAiStatus(),
      auth: { mode: authMode(), project_id: firebaseProjectId() || null, ...approverPolicy() },
      persistence: store.persistence,
      social: publisherStatus(),
      env_files: ENV_FILES_LOADED
    });
  });

  app.get('/api/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  app.post(
    '/api/ai/test',
    requireAuth,
    rateLimit({ windowMs: 60_000, max: 4, name: 'prueba de IA' }),
    wrap(async (_req, res) => {
      res.json(await pingGemini());
    })
  );

  // ---------------------------------------------------------------------------------------
  // Sitios
  // ---------------------------------------------------------------------------------------
  app.get('/api/content', requireAuth, (_req, res) => {
    res.json(getStore().contents.filter((c) => c.status === 'APPROVED' || c.status === 'PUBLISHED').map(summary));
  });

  app.get('/api/all-content', requireAuth, (_req, res) => {
    res.json(getStore().contents.map(summary));
  });

  app.get(
    '/api/content/:id',
    requireAuth,
    wrap((req, res) => {
      res.json(detail(findContent(intParam(req.params.id))));
    })
  );

  app.post(
    '/api/generate',
    requireAuth,
    rateLimit({ windowMs: 60_000, max: 8, name: 'generación con IA' }),
    wrap(async (req: Request, res: Response) => {
      const user = req.user as AuthUser;
      const body = req.body || {};
      const brief = typeof body.brief === 'string' ? body.brief.trim() : '';
      if (!brief) throw new HttpError(400, 'BRIEF_REQUIRED', 'El brief o instrucción es obligatorio.');
      if (brief.length > 4000) throw new HttpError(400, 'BRIEF_TOO_LONG', 'El brief no puede pasar de 4,000 caracteres.');

      const store = getStore();
      const refineId = body.refineOfId ? intParam(body.refineOfId, 'refineOfId') : null;
      const previous = refineId ? findContent(refineId) : null;
      const previousSite = previous?.content || null;
      const allowFallback = body.allowFallback === true;

      let site;
      let ai;
      try {
        ({ site, ai } = await generateSite({ brief, previousSite }));
      } catch (e: any) {
        if (!(e instanceof AiFailure)) throw e;
        console.error(`[ai] ${e.code}: ${e.message} · intentos: ${JSON.stringify(e.ai.attempts)}`);
        if (!allowFallback) {
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
      const logo = safeImageSrc(body.customLogo);
      if (logo) content.custom_logo = logo;
      const hero = safeImageSrc(body.heroImage);
      if (hero) content.hero_image = hero;
      if (body.customColors?.primary) {
        content.brand_colors = {
          primary: safeColor(body.customColors.primary, content.brand_colors.primary),
          secondary: safeColor(body.customColors.secondary, content.brand_colors.secondary),
          accent: safeColor(body.customColors.accent, content.brand_colors.accent)
        };
      }
      if (THEMES.includes(body.designTheme)) content.design_theme = body.designTheme;
      if (!content.design_theme) content.design_theme = 'dark-modern';

      const slug = (content.site_name || 'sitio').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'sitio';
      content.drive_files = {
        pages_file: `/Sitio_Web/Paginas/${slug}_index.html`,
        blog_file: `/Sitio_Web/Blog/articulos_${slug}.md`,
        social_file: `/Redes_Sociales/Para_Publicar/campana_${slug}.json`,
        brand_file: '/Marca/logo_oficial.png'
      };

      const now = new Date().toISOString();
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
        audit(item, { by: `${user.name} <${user.email}>`, action: 'ai_refine', from, to: 'PENDING', note: `Ajuste con ${ai.source === 'gemini' ? ai.model : 'plantilla de respaldo'}: ${brief.slice(0, 160)}` });
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
          created_by: `${user.name} <${user.email}>`,
          drive_file_id: `drive_draft_${id}`,
          ai,
          content,
          history: []
        };
        audit(item, { by: `${user.name} <${user.email}>`, action: 'ai_generate', to: 'PENDING', note: ai.source === 'gemini' ? `Gemini (${ai.model})` : 'Plantilla de respaldo (NO IA)' });
        store.contents.unshift(item);
      }
      store.save();
      res.status(previous ? 200 : 201).json({ id: item.id, status: item.status, ai, record: detail(item) });
    })
  );

  app.post(
    '/api/approve/:id',
    requireApprover,
    wrap((req, res) => {
      const item = approveContent(findContent(intParam(req.params.id)), req.user as AuthUser, req.body || {});
      getStore().save();
      res.json({ message: 'Sitio aprobado y registrado en la auditoría.', status: item.status, record: detail(item) });
    })
  );

  app.post(
    '/api/reject/:id',
    requireApprover,
    wrap((req, res) => {
      const reason = typeof req.body?.reason === 'string' ? req.body.reason : '';
      const item = rejectContent(findContent(intParam(req.params.id)), req.user as AuthUser, reason);
      getStore().save();
      res.json({ message: 'Sitio rechazado.', status: item.status, record: detail(item) });
    })
  );

  app.put(
    '/api/content/:id',
    requireAuth,
    wrap((req, res) => {
      const item = editContent(findContent(intParam(req.params.id)), req.body?.content, req.user as AuthUser);
      getStore().save();
      res.json({ message: 'Contenido actualizado.', status: item.status, record: detail(item) });
    })
  );

  // Sitio aprobado, público. Solo se sirve si está APROBADO y lo aprobado coincide con lo guardado.
  const servePublic = (req: Request, res: Response) => {
    const id = Number.parseInt(String(req.params.id), 10);
    const item = Number.isFinite(id) ? getStore().contents.find((c) => c.id === id) : undefined;
    if (!item || !isPubliclyServable(item)) {
      res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8').send(notFoundPage);
      return;
    }
    const nonce = crypto.randomBytes(16).toString('base64');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'`
    );
    res.send(renderPreview(item, { nonce, preview: false }));
  };
  app.get(['/preview/:id', '/site/:id'], servePublic);

  // ---------------------------------------------------------------------------------------
  // Leads (formulario de contacto de los sitios aprobados)
  // ---------------------------------------------------------------------------------------
  app.use('/api/leads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.post(
    '/api/leads',
    rateLimit({ windowMs: 60_000, max: 6, name: 'contacto', by: 'ip' }),
    wrap((req, res) => {
      const b = req.body || {};
      if (typeof b.website === 'string' && b.website.trim()) return res.json({ ok: true }); // honeypot
      const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n) : '');
      const name = clip(b.name, 120);
      const message = clip(b.message, 2000);
      const phone = clip(b.phone, 40);
      const email = clip(b.email, 160);
      if (!name || !message) throw new HttpError(400, 'LEAD_INVALID', 'Nombre y mensaje son obligatorios.');
      if (!phone && !email) throw new HttpError(400, 'LEAD_INVALID', 'Déjanos un teléfono o un correo para responderte.');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new HttpError(400, 'LEAD_INVALID', 'Correo inválido.');
      const siteIdRaw = Number.parseInt(String(b.site_id), 10);
      const store = getStore();
      const site = Number.isFinite(siteIdRaw) ? store.contents.find((c) => c.id === siteIdRaw) : undefined;
      if (Number.isFinite(siteIdRaw) && (!site || !isPubliclyServable(site))) throw new HttpError(404, 'NOT_FOUND', 'Sitio no disponible.');
      store.leads.unshift({ id: store.nextId('lead'), site_id: site?.id ?? null, name, email, phone, message, created_at: new Date().toISOString() });
      store.leads = store.leads.slice(0, 2000);
      store.save();
      res.status(201).json({ ok: true });
    })
  );

  app.get('/api/leads', requireAuth, (_req, res) => {
    res.json(getStore().leads);
  });

  // ---------------------------------------------------------------------------------------
  // Publicaciones en redes
  // ---------------------------------------------------------------------------------------
  app.get('/api/social', requireAuth, (req, res) => {
    const siteId = req.query.site_id ? Number.parseInt(String(req.query.site_id), 10) : null;
    const posts = getStore().social.filter((p) => (siteId ? p.site_id === siteId : true));
    res.json(posts.map(summarizePost));
  });

  app.post(
    '/api/social/from-site/:siteId',
    requireAuth,
    wrap((req, res) => {
      const site = findContent(intParam(req.params.siteId, 'siteId'));
      const posts = createDraftsFromSite(getStore(), site, req.user as AuthUser, baseUrl(req));
      res.status(201).json(posts.map(summarizePost));
    })
  );

  app.post(
    '/api/social',
    requireAuth,
    wrap((req, res) => {
      const siteId = req.body?.site_id ? intParam(req.body.site_id, 'site_id') : null;
      const site = siteId ? findContent(siteId) : null;
      const post = createPost(getStore(), req.body || {}, req.user as AuthUser, site);
      res.status(201).json(summarizePost(post));
    })
  );

  app.put(
    '/api/social/:id',
    requireAuth,
    wrap((req, res) => {
      res.json(summarizePost(editPost(getStore(), findPost(intParam(req.params.id)), req.body || {}, req.user as AuthUser)));
    })
  );

  app.post(
    '/api/social/:id/submit',
    requireAuth,
    wrap((req, res) => {
      res.json(summarizePost(submitPost(getStore(), findPost(intParam(req.params.id)), req.user as AuthUser)));
    })
  );

  app.post(
    '/api/social/:id/approve',
    requireApprover,
    wrap((req, res) => {
      res.json(summarizePost(approvePost(getStore(), findPost(intParam(req.params.id)), req.user as AuthUser, req.body || {})));
    })
  );

  app.post(
    '/api/social/:id/reject',
    requireApprover,
    wrap((req, res) => {
      const reason = typeof req.body?.reason === 'string' ? req.body.reason : '';
      res.json(summarizePost(rejectPost(getStore(), findPost(intParam(req.params.id)), req.user as AuthUser, reason)));
    })
  );

  app.post(
    '/api/social/:id/publish',
    requireApprover,
    rateLimit({ windowMs: 60_000, max: 10, name: 'publicación' }),
    wrap(async (req, res) => {
      const post = await publishPost(getStore(), findPost(intParam(req.params.id)), req.user as AuthUser);
      res.json(summarizePost(post));
    })
  );

  app.delete(
    '/api/social/:id',
    requireAuth,
    wrap((req, res) => {
      deletePost(getStore(), findPost(intParam(req.params.id)), req.user as AuthUser);
      res.json({ ok: true });
    })
  );

  // ---------------------------------------------------------------------------------------
  // Bitácora de auditoría unificada
  // ---------------------------------------------------------------------------------------
  app.get('/api/audit', requireAuth, (_req, res) => {
    const store = getStore();
    const events = [
      ...store.contents.flatMap((c) => c.history.map((h) => ({ ...h, kind: 'sitio', ref_id: c.id, ref_title: c.title }))),
      ...store.social.flatMap((p) => p.history.map((h) => ({ ...h, kind: 'publicación', ref_id: p.id, ref_title: `${p.platform === 'facebook' ? 'Facebook' : 'Instagram'} · ${p.site_name || 'sin sitio'}` })))
    ];
    events.sort((a, b) => b.at.localeCompare(a.at));
    res.json(events.slice(0, 300));
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ruta de API inexistente.' } });
  });

  app.use(errorHandler);
  return app;
}
