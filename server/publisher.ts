// Publicación a Facebook / Instagram.
//
// Modos (se elige solo según lo configurado; SOCIAL_PUBLISH_MODE lo fuerza):
//  - webhook  → POST firmado (HMAC) a Make/Zapier (MAKE_WEBHOOK_URL), que llama a Meta Graph API.
//               Es el camino que pide la asignación 2026-544-11.
//  - graph    → llamada directa a Meta Graph API (META_PAGE_ID / META_IG_USER_ID / META_PAGE_ACCESS_TOKEN).
//  - dry-run  → no envía nada; deja evidencia de lo que SE ENVIARÍA. Es el modo por defecto, para que
//               nada salga a una red social real por accidente.
//
// Este módulo SOLO envía. Quién puede llamarlo y en qué estado lo decide social.ts (aprobación humana).
import crypto from 'crypto';
import type { PublishResult, SocialPost } from './types.js';

export type PublishMode = 'webhook' | 'graph' | 'dry-run';

export function composeMessage(p: Pick<SocialPost, 'copy' | 'cta' | 'link_url' | 'hashtags'>): string {
  const parts = [p.copy.trim()];
  if (p.link_url) parts.push(p.cta ? `${p.cta.trim()}: ${p.link_url}` : p.link_url);
  if (p.hashtags.trim()) parts.push(p.hashtags.trim());
  return parts.filter(Boolean).join('\n\n');
}

export function publisherConfig(platform: SocialPost['platform']) {
  const forced = process.env.SOCIAL_PUBLISH_MODE as PublishMode | undefined;
  const webhook = process.env.MAKE_WEBHOOK_URL?.trim();
  const token = process.env.META_PAGE_ACCESS_TOKEN?.trim();
  const pageId = process.env.META_PAGE_ID?.trim();
  const igId = process.env.META_IG_USER_ID?.trim();
  const graphReady = platform === 'linkedin' ? false : Boolean(token && (platform === 'facebook' ? pageId : igId));

  let mode: PublishMode = 'dry-run';
  if (forced === 'dry-run') mode = 'dry-run';
  else if (forced === 'webhook' && webhook) mode = 'webhook';
  else if (forced === 'graph' && graphReady) mode = 'graph';
  else if (!forced) mode = webhook ? 'webhook' : graphReady ? 'graph' : 'dry-run';
  return { mode, webhook, token, pageId, igId, graphReady };
}

export function publisherStatus() {
  const fb = publisherConfig('facebook');
  const ig = publisherConfig('instagram');
  const li = publisherConfig('linkedin');
  return {
    facebook: fb.mode,
    instagram: ig.mode,
    linkedin: li.mode,
    webhook_configured: Boolean(fb.webhook),
    webhook_signed: Boolean(process.env.MAKE_WEBHOOK_SECRET?.trim()),
    graph_facebook_ready: fb.graphReady,
    graph_instagram_ready: ig.graphReady
  };
}

function now() {
  return new Date().toISOString();
}

async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text.slice(0, 300) };
  }
}

export interface PublishPayload {
  post_id: number;
  idempotency_key: string;
  platform: SocialPost['platform'];
  message: string;
  copy: string;
  hashtags: string;
  cta: string;
  link_url: string;
  image_url: string;
  scheduled_at: string | null;
  site: { id: number | null; name: string };
  approved_by: string;
  approved_by_email: string;
  approved_at: string;
  approved_hash: string;
}

export function buildPayload(post: SocialPost): PublishPayload {
  return {
    post_id: post.id,
    idempotency_key: `myos-post-${post.id}-${(post.approved_hash || '').slice(0, 12)}`,
    platform: post.platform,
    message: composeMessage(post),
    copy: post.copy,
    hashtags: post.hashtags,
    cta: post.cta,
    link_url: post.link_url,
    image_url: post.image_url,
    scheduled_at: post.scheduled_at,
    site: { id: post.site_id, name: post.site_name || '' },
    approved_by: post.approved_by || '',
    approved_by_email: post.approved_by_email || '',
    approved_at: post.approved_at || '',
    approved_hash: post.approved_hash || ''
  };
}

export async function publishToWebhook(post: SocialPost, url: string): Promise<PublishResult> {
  const body = JSON.stringify(buildPayload(post));
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'User-Agent': 'myos-platform' };
  const secret = process.env.MAKE_WEBHOOK_SECRET?.trim();
  if (secret) headers['x-myos-signature'] = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    const res = await fetch(url, { method: 'POST', headers, body, signal: AbortSignal.timeout(15000) });
    const data = await readJson(res);
    if (!res.ok) {
      return { mode: 'webhook', ok: false, at: now(), http_status: res.status, error: `El webhook respondió ${res.status}: ${JSON.stringify(data).slice(0, 200)}` };
    }
    const external = data?.id || data?.post_id || data?.external_id || data?.permalink;
    return { mode: 'webhook', ok: true, at: now(), http_status: res.status, external_id: external ? String(external) : undefined };
  } catch (e: any) {
    return { mode: 'webhook', ok: false, at: now(), error: `No se pudo contactar el webhook: ${e?.message || e}` };
  }
}

function graphBase() {
  const base = (process.env.META_GRAPH_BASE || 'https://graph.facebook.com').replace(/\/+$/, '');
  const version = process.env.META_GRAPH_VERSION || 'v21.0';
  return `${base}/${version}`;
}

async function graphPost(pathname: string, params: Record<string, string>) {
  const res = await fetch(`${graphBase()}/${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(20000)
  });
  const data = await readJson(res);
  if (!res.ok || data?.error) {
    const msg = data?.error?.message || JSON.stringify(data).slice(0, 200);
    throw new Error(`Meta ${res.status}: ${msg}`);
  }
  return data;
}

export async function publishToGraph(post: SocialPost): Promise<PublishResult> {
  const cfg = publisherConfig(post.platform);
  const message = composeMessage(post);
  try {
    if (post.platform === 'facebook') {
      let data;
      if (post.image_url) {
        data = await graphPost(`${cfg.pageId}/photos`, { url: post.image_url, caption: message, access_token: cfg.token! });
      } else {
        const params: Record<string, string> = { message, access_token: cfg.token! };
        if (post.link_url) params.link = post.link_url;
        data = await graphPost(`${cfg.pageId}/feed`, params);
      }
      return { mode: 'graph', ok: true, at: now(), http_status: 200, external_id: String(data.post_id || data.id || '') || undefined };
    }
    // Instagram: contenedor de medios → esperar → publicar
    const container = await graphPost(`${cfg.igId}/media`, { image_url: post.image_url, caption: message, access_token: cfg.token! });
    const creationId = String(container.id);
    for (let i = 0; i < 6; i++) {
      const res = await fetch(`${graphBase()}/${creationId}?fields=status_code&access_token=${encodeURIComponent(cfg.token!)}`, { signal: AbortSignal.timeout(15000) });
      const st = await readJson(res);
      if (st?.status_code === 'FINISHED') break;
      if (st?.status_code === 'ERROR' || st?.status_code === 'EXPIRED') throw new Error(`Instagram no pudo procesar la imagen (${st.status_code}).`);
      if (i === 5) throw new Error('Instagram tardó demasiado en procesar la imagen.');
      await new Promise((r) => setTimeout(r, Number(process.env.META_POLL_MS ?? 2000)));
    }
    const published = await graphPost(`${cfg.igId}/media_publish`, { creation_id: creationId, access_token: cfg.token! });
    return { mode: 'graph', ok: true, at: now(), http_status: 200, external_id: String(published.id || '') || undefined };
  } catch (e: any) {
    return { mode: 'graph', ok: false, at: now(), error: e?.message || String(e) };
  }
}

export function dryRun(post: SocialPost): PublishResult {
  return {
    mode: 'dry-run',
    ok: true,
    at: now(),
    note: `Simulación: NO se envió nada a ${post.platform === 'facebook' ? 'Facebook' : post.platform === 'instagram' ? 'Instagram' : 'LinkedIn'}. Configura MAKE_WEBHOOK_URL (o las llaves de Meta) para publicar de verdad.`
  };
}

export async function publish(post: SocialPost): Promise<PublishResult> {
  const cfg = publisherConfig(post.platform);
  if (cfg.mode === 'webhook') return publishToWebhook(post, cfg.webhook!);
  if (cfg.mode === 'graph') return publishToGraph(post);
  return dryRun(post);
}
