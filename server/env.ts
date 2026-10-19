// Carga de variables de entorno.
//
// CAUSA RAÍZ del "Gemini no genera": el servidor solo leía ./.env (raíz) y la llave estaba en
// ./frontend/.env, así que process.env.GEMINI_API_KEY quedaba vacío y la generación caía
// en silencio a plantillas. Ahora se leen varios archivos y se informa de dónde salió cada llave.
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(here, '..');

const CANDIDATE_FILES = ['.env', '.env.local', 'frontend/.env'];

/** Valores típicos de relleno que NO son una llave real. */
const PLACEHOLDER = /^(|undefined|null|your[_-]?.*|my[_-]?.*|changeme|todo|xxx+|<.*>|\*+)$/i;

export function isPlaceholder(value: string | undefined): boolean {
  return value === undefined || PLACEHOLDER.test(value.trim());
}

export const ENV_SOURCES: Record<string, string> = {};
export const ENV_FILES_LOADED: string[] = [];

export function loadEnv(root = PROJECT_ROOT): void {
  for (const rel of CANDIDATE_FILES) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) continue;
    ENV_FILES_LOADED.push(rel);
    const parsed = dotenv.parse(fs.readFileSync(file));
    for (const [key, value] of Object.entries(parsed)) {
      // El entorno real manda, salvo que esté vacío o sea un valor de relleno.
      if (isPlaceholder(process.env[key]) && !isPlaceholder(value)) {
        process.env[key] = value;
        ENV_SOURCES[key] = rel;
      }
    }
  }
}

loadEnv();

export const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

export function list(name: string, fallback: string[] = []): string[] {
  const raw = process.env[name];
  if (!raw || !raw.trim()) return fallback;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
