// Proyectos: cada persona puede tener varios (por ejemplo, uno por cliente o negocio).
// Cada proyecto tiene su propio perfil, recorrido guiado, chat, contenidos y conexión a redes.
import type { Request } from 'express';
import type { AuthUser, Project } from './types.js';
import { HttpError } from './http.js';
import type { Store } from './store.js';
import { getStore } from './store.js';

const now = () => new Date().toISOString();
const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/<[^>]*>/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max) : '';

export const scopeKey = (email: string, projectId: number) => `${email.toLowerCase()}::p${projectId}`;
/** Clave de almacenamiento: con proyecto activo es por proyecto; sin proyecto (compatibilidad) es solo por correo. */
export const userScope = (u: AuthUser) => u.scope || u.email.toLowerCase();

export function projectsOf(store: Store, email: string): Project[] {
  const e = email.toLowerCase();
  return store.projects.filter((p) => p.owner_email.toLowerCase() === e);
}

export function createProject(store: Store, user: AuthUser, input: { name?: unknown; description?: unknown }): Project {
  const name = clean(input.name, 80);
  if (!name) throw new HttpError(400, 'NAME_REQUIRED', 'Ponle un nombre a tu proyecto.');
  if (projectsOf(store, user.email).length >= 50) throw new HttpError(400, 'TOO_MANY', 'Llegaste al máximo de 50 proyectos.');
  const t = now();
  const p: Project = { id: store.nextId('project'), name, description: clean(input.description, 300), owner_email: user.email.toLowerCase(), created_at: t, updated_at: t };
  store.projects.push(p);
  store.save();
  return p;
}

/**
 * Primera vez de una cuenta: se crea "Mi primer proyecto" y se le pasan los datos que ya tenía
 * (perfil, recorrido, chat, publicaciones y sitios), para no perder nada de antes de que existieran los proyectos.
 */
export function ensureDefaultProject(store: Store, user: AuthUser): Project {
  const existing = projectsOf(store, user.email);
  if (existing.length) return existing[0];
  const p = createProject(store, user, { name: 'Mi primer proyecto' });
  const email = user.email.toLowerCase();
  const to = scopeKey(email, p.id);
  if (store.profiles[email]) { store.profiles[to] = store.profiles[email]; delete store.profiles[email]; }
  if (store.guide[email]) { store.guide[to] = store.guide[email]; delete store.guide[email]; }
  if (store.chats[email]) { store.chats[to] = store.chats[email]; delete store.chats[email]; }
  const mine = (by?: string) => (by || '').toLowerCase().includes(`<${email}>`);
  for (const c of store.contents) if (c.project_id == null && mine(c.created_by)) c.project_id = p.id;
  for (const s of store.social) if (s.project_id == null && mine(s.created_by)) s.project_id = p.id;
  store.save();
  return p;
}

export function getOwnedProject(store: Store, user: AuthUser, id: number): Project {
  const p = store.projects.find((x) => x.id === id);
  if (!p || p.owner_email.toLowerCase() !== user.email.toLowerCase()) throw new HttpError(404, 'PROJECT_NOT_FOUND', 'Ese proyecto no existe.');
  return p;
}

export function updateProject(store: Store, user: AuthUser, id: number, input: { name?: unknown; description?: unknown }): Project {
  const p = getOwnedProject(store, user, id);
  if (input.name !== undefined) {
    const n = clean(input.name, 80);
    if (!n) throw new HttpError(400, 'NAME_REQUIRED', 'El proyecto necesita un nombre.');
    p.name = n;
  }
  if (input.description !== undefined) p.description = clean(input.description, 300);
  p.updated_at = now();
  store.save();
  return p;
}

/** Borra el proyecto solo si no tiene nada aprobado o publicado: la bitácora de aprobaciones no se destruye. */
export function deleteProject(store: Store, user: AuthUser, id: number): void {
  const p = getOwnedProject(store, user, id);
  const protectedPost = store.social.some((s) => s.project_id === id && ['APPROVED', 'PUBLISHED', 'FAILED'].includes(s.status));
  const protectedSite = store.contents.some((c) => c.project_id === id && ['APPROVED', 'PUBLISHED'].includes(c.status));
  if (protectedPost || protectedSite) {
    throw new HttpError(409, 'HAS_APPROVED_CONTENT', 'Este proyecto tiene contenido aprobado o publicado y no se puede borrar, para conservar el registro de quién aprobó.');
  }
  for (const s of store.social.filter((x) => x.project_id === id)) delete store.media[String(s.id)];
  store.social = store.social.filter((s) => s.project_id !== id);
  store.contents = store.contents.filter((c) => c.project_id !== id);
  const k = scopeKey(user.email, id);
  delete store.profiles[k];
  delete store.guide[k];
  delete store.chats[k];
  delete store.connections[String(id)];
  store.projects = store.projects.filter((x) => x.id !== p.id);
  store.save();
}

/** Lee la cabecera x-project-id y deja el proyecto activo en el usuario. Sin cabecera, trabaja sin proyecto (compatibilidad). */
export function applyProject(req: Request, user: AuthUser): void {
  const raw = req.header('x-project-id');
  if (!raw) return;
  const id = Number.parseInt(raw, 10);
  if (!Number.isInteger(id)) throw new HttpError(400, 'BAD_PROJECT', 'Proyecto inválido.');
  const p = getOwnedProject(getStore(), user, id);
  user.project_id = p.id;
  user.scope = scopeKey(user.email, p.id);
}

export function projectSummary(store: Store, p: Project) {
  const k = scopeKey(p.owner_email, p.id);
  const steps = Object.values(store.guide[k] || {});
  const posts = store.social.filter((s) => s.project_id === p.id);
  const sites = store.contents.filter((c) => c.project_id === p.id);
  const conn = store.connections[String(p.id)];
  return {
    ...p,
    business_name: store.profiles[k]?.business_name || '',
    steps_confirmed: steps.filter((s) => s.status === 'CONFIRMED').length,
    posts: posts.length,
    posts_pending: posts.filter((s) => s.status === 'DRAFT' || s.status === 'PENDING_APPROVAL').length,
    posts_published: posts.filter((s) => s.status === 'PUBLISHED').length,
    sites: sites.length,
    connected: Boolean(conn?.live && (conn.page_id || conn.ig_user_id || conn.webhook_url))
  };
}
