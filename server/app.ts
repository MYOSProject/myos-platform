import './env.js'; // debe ir primero: carga .env y frontend/.env
import crypto from 'crypto';
import express from 'express';
import type { Request, Response } from 'express';
import { ENV_FILES_LOADED } from './env.js';
import { authMode, approverPolicy, firebaseProjectId, rateLimit, requireApprover, requireAuth } from './auth.js';
import { getAiStatus, pingGemini } from './gemini.js';
import { createOrRefineSite } from './sites.js';
import { generateStandaloneHtml } from './siteHtml.js';
import { getStore } from './store.js';
import { HttpError, errorHandler, intParam, wrap } from './http.js';
import {
  approveContent,
  audit,
  editContent,
  isPubliclyServable,
  rejectContent
} from './content.js';
import {
  attachMedia,
  mediaIsPublic,
  platformLabel,
  approvePost,
  restoreVersion,
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
import { chatTurn, clearChat, getChat, getProfile, runChatAction, saveProfile } from './chat.js';
import { autoCreate, autoUpdate, confirmStep, createPosts, generateStep, guideView, regeneratePost, revisePost, saveAnswers, saveReport, suggestIdeas } from './guide.js';
import { createProject, deleteProject, ensureDefaultProject, getOwnedProject, projectsOf, projectSummary, updateProject } from './projects.js';
import { connectionView, deleteConnection, saveConnection, setLive, testConnection } from './connections.js';
import { guideForPrompt } from './guide.js';
import { completeness, composeSiteBrief, missingEssentials, FIELD_LABELS } from './profile.js';
import type { AuthUser, ContentItem, SocialPost } from './types.js';

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
  return { ...p, has_media: Boolean(getStore().media[String(p.id)]), problems: validatePost(p) };
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

const notFoundPage = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sitio no disponible</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f6f7fb;color:#0f1c3c;text-align:center;padding:24px}main{max-width:420px}h1{font-size:22px}p{color:#586178}</style></head>
<body><main><h1>Este sitio no está disponible</h1><p>Aún no ha sido aprobado o ya no existe.</p></main></body></html>`;

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '12mb' }));

  // Firestore: antes de cada petición se actualiza el estado, y los cambios se guardan ANTES de responder
  // (en serverless la función puede congelarse apenas se responde).
  app.use(async (req, res, next) => {
    const store = getStore();
    const remote = store.remote;
    if (!remote || req.path === '/api/health') return next();
    remote.inflight++;
    let done = false;
    const release = () => { if (!done) { done = true; remote.inflight--; } };
    res.on('close', release);
    try {
      await remote.ensureFresh();
    } catch (e: any) {
      release();
      console.error('[remote] no se pudo leer la base de datos:', e?.message || e);
      return void res.status(503).json({ error: { code: 'DB_UNAVAILABLE', message: 'No se pudo leer la base de datos. Revisa FIREBASE_SERVICE_ACCOUNT y que Firestore esté creado.' } });
    }
    const end = res.end.bind(res) as (...a: any[]) => any;
    (res as any).end = (...args: any[]) => {
      remote.commit().then(
        () => { release(); end(...args); },
        (e: any) => {
          release();
          console.error('[remote] no se pudo guardar:', e?.message || e);
          res.statusCode = 503;
          res.removeHeader('Content-Length');
          res.setHeader('Content-Type', 'application/json');
          end(JSON.stringify({ error: { code: 'DB_WRITE_FAILED', message: 'No se pudo guardar en la base de datos. Inténtalo de nuevo.' } }));
        }
      );
      return res;
    };
    next();
  });

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

  app.get('/api/all-content', requireAuth, (req, res) => {
    const pid = (req.user as AuthUser).project_id;
    res.json(getStore().contents.filter((c) => (pid ? c.project_id === pid : true)).map(summary));
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
      const refineId = body.refineOfId ? intParam(body.refineOfId, 'refineOfId') : null;
      const { item, ai, created } = await createOrRefineSite(getStore(), user, {
        brief,
        refineOfId: refineId,
        allowFallback: body.allowFallback === true,
        customLogo: body.customLogo,
        heroImage: body.heroImage,
        customColors: body.customColors,
        designTheme: body.designTheme
      });
      res.status(created ? 201 : 200).json({ id: item.id, status: item.status, ai, record: detail(item) });
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
    const pid = (req.user as AuthUser).project_id;
    const posts = getStore().social.filter((p) => (siteId ? p.site_id === siteId : true) && (pid ? p.project_id === pid : true));
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

  // Pieza gráfica de una publicación (JPEG dibujado en el navegador)
  app.post(
    '/api/social/:id/image',
    requireAuth,
    wrap((req, res) => {
      const post = attachMedia(getStore(), findPost(intParam(req.params.id)), req.body?.data_url, baseUrl(req), req.user as AuthUser);
      res.json(summarizePost(post));
    })
  );

  app.get(
    '/api/social/:id/image',
    requireAuth,
    wrap(async (req, res) => {
      const m = await getStore().mediaData(String(intParam(req.params.id)));
      if (!m) throw new HttpError(404, 'NO_MEDIA', 'Esta publicación no tiene imagen.');
      res.type(m.mime).send(Buffer.from(m.b64, 'base64'));
    })
  );

  // Pública SOLO cuando la publicación está aprobada: es lo que descarga Meta al publicar.
  app.get('/media/:file', wrap(async (req, res) => {
    const id = Number.parseInt(String(req.params.file).replace(/\.jpg$/i, ''), 10);
    const post = getStore().social.find((p) => p.id === id);
    const m = mediaIsPublic(post) ? await getStore().mediaData(String(id)) : undefined;
    if (!m) return res.status(404).type('text/plain').send('No disponible');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.type(m.mime).send(Buffer.from(m.b64, 'base64'));
  }));

  // ---------------------------------------------------------------------------------------
  // Perfil del negocio y asistente (chatbot)
  // ---------------------------------------------------------------------------------------
  const profileView = (user: AuthUser) => {
    const profile = getProfile(getStore(), user);
    return { profile, completeness: completeness(profile), missing: missingEssentials(profile).map((f) => FIELD_LABELS[f]) };
  };

  app.get('/api/profile', requireAuth, (req, res) => {
    res.json(profileView(req.user as AuthUser));
  });

  app.put(
    '/api/profile',
    requireAuth,
    wrap((req, res) => {
      saveProfile(getStore(), req.user as AuthUser, req.body || {});
      res.json(profileView(req.user as AuthUser));
    })
  );

  // ---------------------------------------------------------------------------------------
  // Recorrido guiado y creación de contenido
  // ---------------------------------------------------------------------------------------
  const aiLimit = rateLimit({ windowMs: 60_000, max: 12, name: 'generación con IA' });
  app.get('/api/guide', requireAuth, (req, res) => {
    res.json(guideView(getStore(), req.user as AuthUser));
  });
  app.put('/api/guide/:step', requireAuth, wrap((req, res) => {
    saveAnswers(getStore(), req.user as AuthUser, String(req.params.step), req.body?.answers);
    res.json(guideView(getStore(), req.user as AuthUser));
  }));
  app.post('/api/guide/:step/generate', requireAuth, aiLimit, wrap(async (req, res) => {
    const user = req.user as AuthUser;
    if (req.body?.answers) saveAnswers(getStore(), user, String(req.params.step), req.body.answers);
    await generateStep(getStore(), user, String(req.params.step));
    res.json(guideView(getStore(), user));
  }));
  app.put('/api/guide/:step/report', requireAuth, wrap((req, res) => {
    saveReport(getStore(), req.user as AuthUser, String(req.params.step), req.body || {});
    res.json(guideView(getStore(), req.user as AuthUser));
  }));
  app.post('/api/guide/:step/confirm', requireAuth, wrap((req, res) => {
    confirmStep(getStore(), req.user as AuthUser, String(req.params.step));
    res.json(guideView(getStore(), req.user as AuthUser));
  }));
  app.post('/api/create/ideas', requireAuth, aiLimit, wrap(async (req, res) => {
    res.json({ ideas: await suggestIdeas(getStore(), req.user as AuthUser) });
  }));
  app.post('/api/create/posts', requireAuth, aiLimit, wrap(async (req, res) => {
    const posts = await createPosts(getStore(), req.user as AuthUser, req.body || {});
    res.status(201).json(posts.map(summarizePost));
  }));
  app.post('/api/content/auto-create', requireAuth, aiLimit, wrap(async (req, res) => {
    const posts = await autoCreate(getStore(), req.user as AuthUser, Number(req.body?.count) || 6);
    res.status(201).json(posts.map(summarizePost));
  }));
  app.post('/api/content/auto-update', requireAuth, aiLimit, wrap(async (req, res) => {
    const out = await autoUpdate(getStore(), req.user as AuthUser);
    res.json({ posts: out.posts.map(summarizePost), created: out.created.map(summarizePost) });
  }));
  // «Quiero cambiar…»: la IA ajusta el sitio con lo que la persona pide en lenguaje normal (color, textos, etc.). El sitio vuelve a revisión.
  app.post('/api/content/:id/revise', requireAuth, aiLimit, wrap(async (req, res) => {
    const item = findContent(intParam(req.params.id));
    const ask = typeof req.body?.instruction === 'string' ? req.body.instruction.trim().slice(0, 800) : '';
    if (!ask) throw new HttpError(400, 'INSTRUCTION_REQUIRED', 'Dime qué quieres cambiar.');
    const { item: out } = await createOrRefineSite(getStore(), req.user as AuthUser, {
      brief: `Cambio que pide la persona sobre el sitio actual. Aplica SOLO este cambio y conserva todo lo demás: ${ask}`,
      refineOfId: item.id
    });
    res.json(summary(out));
  }));
  app.post('/api/create/site', requireAuth, aiLimit, wrap(async (req, res) => {
    const user = req.user as AuthUser;
    const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim().slice(0, 1500) : '';
    const profile = getProfile(getStore(), user);
    const brief = `${composeSiteBrief(profile, topic)}\n\nGuía confirmada (dato):\n${guideForPrompt(getStore(), user)}`.slice(0, 3990);
    const { item } = await createOrRefineSite(getStore(), user, { brief, customLogo: profile.logo, customColors: profile.brand_colors });
    res.status(201).json(summary(item));
  }));
  app.post('/api/social/:id/revise', requireAuth, aiLimit, wrap(async (req, res) => {
    const post = findPost(intParam(req.params.id));
    const out = await revisePost(getStore(), req.user as AuthUser, post, req.body?.instruction);
    res.json({ ...summarizePost(out), is_new_version: out.id !== post.id });
  }));

  // ---------------------------------------------------------------------------------------
  // Proyectos y conexiones
  // ---------------------------------------------------------------------------------------
  const projectList = (user: AuthUser) => projectsOf(getStore(), user.email).map((p) => projectSummary(getStore(), p));
  app.get('/api/projects', requireAuth, (req, res) => {
    const user = req.user as AuthUser;
    ensureDefaultProject(getStore(), user);
    res.json({ projects: projectList(user) });
  });
  app.post('/api/projects', requireAuth, wrap((req, res) => {
    const user = req.user as AuthUser;
    const p = createProject(getStore(), user, req.body || {});
    res.status(201).json({ project: projectSummary(getStore(), p), projects: projectList(user) });
  }));
  app.put('/api/projects/:id', requireAuth, wrap((req, res) => {
    const user = req.user as AuthUser;
    updateProject(getStore(), user, intParam(req.params.id), req.body || {});
    res.json({ projects: projectList(user) });
  }));
  app.delete('/api/projects/:id', requireAuth, wrap((req, res) => {
    const user = req.user as AuthUser;
    deleteProject(getStore(), user, intParam(req.params.id));
    res.json({ projects: projectList(user) });
  }));

  const needProject = (user: AuthUser) => {
    if (!user.project_id) throw new HttpError(400, 'NEED_PROJECT', 'Elige un proyecto primero.');
    return getOwnedProject(getStore(), user, user.project_id);
  };
  app.get('/api/connections', requireAuth, wrap((req, res) => {
    const p = needProject(req.user as AuthUser);
    res.json(connectionView(getStore(), p.id));
  }));
  app.put('/api/connections', requireAuth, wrap((req, res) => {
    const p = needProject(req.user as AuthUser);
    saveConnection(getStore(), req.user as AuthUser, p.id, req.body || {});
    res.json(connectionView(getStore(), p.id));
  }));
  app.post('/api/connections/test', requireAuth, rateLimit({ windowMs: 60_000, max: 6, name: 'prueba de conexión' }), wrap(async (req, res) => {
    const p = needProject(req.user as AuthUser);
    const result = await testConnection(getStore(), p.id);
    res.json({ result, ...connectionView(getStore(), p.id) });
  }));
  app.post('/api/connections/live', requireAuth, wrap((req, res) => {
    const p = needProject(req.user as AuthUser);
    setLive(getStore(), req.user as AuthUser, p.id, req.body?.live === true);
    res.json(connectionView(getStore(), p.id));
  }));
  app.delete('/api/connections', requireAuth, wrap((req, res) => {
    const p = needProject(req.user as AuthUser);
    deleteConnection(getStore(), p.id);
    res.json(connectionView(getStore(), p.id));
  }));

  app.post('/api/social/:id/regenerate', requireAuth, aiLimit, wrap(async (req, res) => {
    const post = findPost(intParam(req.params.id));
    const out = await regeneratePost(getStore(), req.user as AuthUser, post);
    res.json({ ...summarizePost(out), is_new_version: out.id !== post.id });
  }));
  app.post('/api/social/:id/restore', requireAuth, wrap((req, res) => {
    const post = findPost(intParam(req.params.id));
    res.json(summarizePost(restoreVersion(getStore(), post, Number(req.body?.index), req.user as AuthUser)));
  }));

  app.get('/api/chat', requireAuth, (req, res) => {
    const user = req.user as AuthUser;
    const store = getStore();
    const messages = getChat(store, user);
    const ids = (kind: string) => new Set(messages.flatMap((m) => (m.artifacts || []).filter((a) => a.kind === kind).map((a) => a.id)));
    const siteIds = ids('site');
    const postIds = ids('post');
    res.json({
      messages,
      sites: store.contents.filter((c) => siteIds.has(c.id)).map(summary),
      posts: store.social.filter((p) => postIds.has(p.id)).map(summarizePost),
      ...profileView(user)
    });
  });

  app.post(
    '/api/chat',
    requireAuth,
    rateLimit({ windowMs: 60_000, max: 20, name: 'chat' }),
    wrap(async (req, res) => {
      const r = await chatTurn(getStore(), req.user as AuthUser, typeof req.body?.message === 'string' ? req.body.message : '');
      res.status(201).json({ message: r.message, user_message: r.user_message, posts: r.posts.map(summarizePost), ...profileView(req.user as AuthUser) });
    })
  );

  const running = new Set<string>();
  app.post(
    '/api/chat/run',
    requireAuth,
    rateLimit({ windowMs: 60_000, max: 8, name: 'generación con IA' }),
    wrap(async (req, res) => {
      const user = req.user as AuthUser;
      const id = String(req.body?.message_id || '');
      const lock = `${user.email}:${id}`;
      if (running.has(lock)) throw new HttpError(409, 'IN_PROGRESS', 'Esto ya se está generando.');
      running.add(lock);
      try {
        const { message, site } = await runChatAction(getStore(), user, id);
        res.json({ message, site: summary(site) });
      } finally {
        running.delete(lock);
      }
    })
  );

  app.delete('/api/chat', requireAuth, (req, res) => {
    clearChat(getStore(), req.user as AuthUser);
    res.json({ ok: true });
  });

  // ---------------------------------------------------------------------------------------
  // Bitácora de auditoría unificada
  // ---------------------------------------------------------------------------------------
  app.get('/api/audit', requireAuth, (_req, res) => {
    const store = getStore();
    const events = [
      ...store.contents.flatMap((c) => c.history.map((h) => ({ ...h, kind: 'sitio', ref_id: c.id, ref_title: c.title }))),
      ...store.social.flatMap((p) => p.history.map((h) => ({ ...h, kind: 'publicación', ref_id: p.id, ref_title: `${platformLabel(p.platform)} · ${p.site_name || 'sin sitio'}` })))
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
