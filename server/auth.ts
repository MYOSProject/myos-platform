// Autenticación y autorización.
//
// REGLA NO NEGOCIABLE del proyecto: "quien apruebe debe quedar registrado". Antes el nombre y el
// correo del aprobador venían del body de la petición (falsificables) y, si faltaban, se registraba
// por defecto a Carlos Torres. Ahora la identidad sale de un ID token de Firebase VERIFICADO
// en el servidor (firma, emisor, audiencia y expiración) y el correo debe estar verificado.
import fs from 'fs';
import path from 'path';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { PROJECT_ROOT, isProd, list } from './env.js';
import type { AuthUser } from './types.js';

const DEFAULT_JWKS = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMode(): 'firebase' | 'dev' {
  if (process.env.AUTH_MODE === 'dev') {
    if (isProd) {
      console.error('[auth] AUTH_MODE=dev se ignora en producción.');
      return 'firebase';
    }
    return 'dev';
  }
  return 'firebase';
}

export function firebaseProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID?.trim()) return process.env.FIREBASE_PROJECT_ID.trim();
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'firebase-applet-config.json'), 'utf8'));
    return String(cfg.projectId || '');
  } catch {
    return '';
  }
}

export function approverEmails(): string[] {
  return list('APPROVER_EMAILS').map((e) => e.toLowerCase());
}

export function approverPolicy(): { policy: 'allowlist' | 'any-verified-user'; count: number } {
  const n = approverEmails().length;
  return { policy: n > 0 ? 'allowlist' : 'any-verified-user', count: n };
}

export function isApproverEmail(email: string): boolean {
  const allow = approverEmails();
  return allow.length === 0 ? true : allow.includes(email.toLowerCase());
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
function jwks() {
  const url = process.env.FIREBASE_JWKS_URL?.trim() || DEFAULT_JWKS;
  let set = jwksCache.get(url);
  if (!set) {
    set = createRemoteJWKSet(new URL(url));
    jwksCache.set(url, set);
  }
  return set;
}

export class AuthError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function verifyFirebaseToken(token: string): Promise<AuthUser> {
  const projectId = firebaseProjectId();
  if (!projectId) throw new AuthError(500, 'NO_PROJECT_ID', 'Falta FIREBASE_PROJECT_ID en el servidor.');
  try {
    const { payload } = await jwtVerify(token, jwks(), {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      clockTolerance: 10
    });
    const email = typeof payload.email === 'string' ? payload.email : '';
    if (!email) throw new AuthError(401, 'NO_EMAIL', 'La cuenta no tiene correo asociado.');
    return {
      uid: String(payload.sub),
      email,
      name: typeof payload.name === 'string' && payload.name ? payload.name : email.split('@')[0],
      emailVerified: payload.email_verified === true,
      isApprover: payload.email_verified === true && isApproverEmail(email),
      via: 'firebase'
    };
  } catch (e: any) {
    if (e instanceof AuthError) throw e;
    const expired = e?.code === 'ERR_JWT_EXPIRED';
    throw new AuthError(401, expired ? 'TOKEN_EXPIRED' : 'BAD_TOKEN', expired ? 'La sesión expiró. Vuelve a iniciar sesión.' : 'Token de sesión inválido.');
  }
}

export async function authenticate(req: Request): Promise<AuthUser | null> {
  if (authMode() === 'dev') {
    const dev = req.header('x-dev-user')?.trim();
    if (dev && /^[^\s@]+@[^\s@]+$/.test(dev)) {
      return { uid: `dev:${dev}`, email: dev, name: dev.split('@')[0], emailVerified: true, isApprover: isApproverEmail(dev), via: 'dev' };
    }
    return null;
  }
  const header = req.header('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m) return null;
  return verifyFirebaseToken(m[1]);
}

function sendAuthError(res: Response, e: AuthError) {
  res.status(e.status).json({ error: { code: e.code, message: e.message } });
}

/** Exige sesión válida. */
export const requireAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authenticate(req);
    if (!user) return sendAuthError(res, new AuthError(401, 'NO_TOKEN', 'Inicia sesión para continuar.'));
    req.user = user;
    next();
  } catch (e) {
    sendAuthError(res, e instanceof AuthError ? e : new AuthError(401, 'BAD_TOKEN', 'No se pudo validar la sesión.'));
  }
};

/** Exige sesión válida + permiso de aprobar/publicar (correo verificado y, si existe, en APPROVER_EMAILS). */
export const requireApprover: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authenticate(req);
    if (!user) return sendAuthError(res, new AuthError(401, 'NO_TOKEN', 'Inicia sesión para continuar.'));
    if (!user.emailVerified) {
      return sendAuthError(
        res,
        new AuthError(403, 'EMAIL_NOT_VERIFIED', `El correo ${user.email} no está verificado. Entra con Google o verifica tu correo para poder aprobar.`)
      );
    }
    if (!user.isApprover) {
      return sendAuthError(
        res,
        new AuthError(403, 'NOT_APPROVER', `Tu cuenta (${user.email}) no está en la lista de aprobadores (APPROVER_EMAILS).`)
      );
    }
    req.user = user;
    next();
  } catch (e) {
    sendAuthError(res, e instanceof AuthError ? e : new AuthError(401, 'BAD_TOKEN', 'No se pudo validar la sesión.'));
  }
};

// ---------------------------------------------------------------------------------------------
// Límite de peticiones (en memoria; suficiente para proteger la cuota de Gemini)
// ---------------------------------------------------------------------------------------------
export function rateLimit(opts: { windowMs: number; max: number; name: string; by?: 'user' | 'ip' }): RequestHandler {
  const hits = new Map<string, number[]>();
  const max = opts.max * (Number(process.env.RATE_LIMIT_SCALE) || 1); // solo para pruebas
  return (req, res, next) => {
    const key = (opts.by === 'ip' ? req.ip : req.user?.uid || req.ip) || 'anon';
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < opts.windowMs);
    if (recent.length >= max) {
      const retry = Math.ceil((opts.windowMs - (now - recent[0])) / 1000);
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ error: { code: 'RATE_LIMIT', message: `Demasiadas solicitudes (${opts.name}). Intenta en ${retry} s.` } });
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (!v.some((t) => now - t < opts.windowMs)) hits.delete(k);
    }
    next();
  };
}
