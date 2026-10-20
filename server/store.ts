// Persistencia simple en archivo JSON (escritura atómica) con caché en memoria.
//
// Antes todo vivía en un arreglo en memoria: se perdía al reiniciar y, en Vercel, entre una
// invocación y otra. Esto sobrevive reinicios en local. En Vercel el disco es efímero (/tmp):
// para producción real hay que cambiar este módulo por una base de datos (Firestore, Postgres...).
import fs from 'fs';
import path from 'path';
import { PROJECT_ROOT, isProd } from './env.js';
import { SEED_ITEMS } from './seed.js';
import { RemoteSync, remoteConfigFromEnv } from './remote.js';
import type { BusinessProfile, ChatMessage, GuideStepState, Project, ProjectConnection, ContentItem, Lead, MediaItem, SocialPost } from './types.js';

interface DbShape {
  version: 1;
  counters: { content: number; social: number; lead: number; project?: number };
  contents: ContentItem[];
  social: SocialPost[];
  leads: Lead[];
  profiles?: Record<string, BusinessProfile>;
  chats?: Record<string, ChatMessage[]>;
  media?: Record<string, MediaItem>;
  guide?: Record<string, Record<string, GuideStepState>>;
  projects?: Project[];
  connections?: Record<string, ProjectConnection>;
}

export type Persistence = 'file' | 'ephemeral' | 'memory' | 'firestore';

export class Store {
  contents: ContentItem[] = [];
  social: SocialPost[] = [];
  leads: Lead[] = [];
  profiles: Record<string, BusinessProfile> = {};
  chats: Record<string, ChatMessage[]> = {};
  media: Record<string, MediaItem> = {};
  guide: Record<string, Record<string, GuideStepState>> = {};
  projects: Project[] = [];
  connections: Record<string, ProjectConnection> = {};
  counters = { content: 0, social: 0, lead: 0, project: 0 };
  persistence: Persistence;
  /** Con Firestore: hay cambios sin escribir. */
  dirty = false;
  remote: RemoteSync | null = null;
  loadedFromRemote = false;
  readonly file: string | null;
  private timer: NodeJS.Timeout | null = null;

  constructor(file: string | null, opts: { seed: boolean; ephemeral?: boolean; remote?: import('./remote.js').RemoteConfig | null }) {
    if (opts.remote) {
      // Firestore: no se usa archivo; los datos se cargan en la primera petición (ensureFresh).
      this.file = null;
      this.persistence = 'firestore';
      this.remote = new RemoteSync(opts.remote, this);
      return;
    }
    this.file = file;
    this.persistence = !file ? 'memory' : opts.ephemeral ? 'ephemeral' : 'file';
    let loaded = false;
    if (file && fs.existsSync(file)) {
      try {
        const db = JSON.parse(fs.readFileSync(file, 'utf8')) as DbShape;
        this.contents = db.contents || [];
        this.social = db.social || [];
        this.leads = db.leads || [];
        this.profiles = db.profiles || {};
        this.chats = db.chats || {};
        this.media = db.media || {};
        this.guide = db.guide || {};
        this.projects = db.projects || [];
        this.connections = db.connections || {};
        this.counters = { content: 0, social: 0, lead: 0, project: 0, ...(db.counters || {}) };
        loaded = true;
      } catch (e) {
        // Archivo dañado: se conserva una copia y se empieza limpio (nunca se pisa en silencio).
        try {
          fs.copyFileSync(file, `${file}.corrupt-${Date.now()}`);
        } catch {
          /* ignore */
        }
        console.error('[store] db.json ilegible, se respaldó y se inicia vacío:', (e as Error).message);
      }
    }
    if (!loaded && opts.seed) this.seed();
  }

  private seed() {
    for (const s of SEED_ITEMS) {
      const id = ++this.counters.content;
      const created = s.created_at || new Date().toISOString();
      this.contents.push({
        id,
        title: s.title,
        slug: s.slug,
        category: s.category,
        status: 'PENDING',
        body_text: s.body_text,
        created_at: created,
        created_by: 'Datos de ejemplo',
        approved_at: null,
        approved_by: null,
        approved_by_email: null,
        approved_hash: null,
        drive_file_id: s.drive_file_id,
        is_seed: true,
        ai: { source: 'seed', attempts: [] },
        content: s.content,
        history: [{ at: created, by: 'sistema', action: 'seed', to: 'PENDING', note: 'Sitio de ejemplo; requiere aprobación humana.' }]
      });
    }
    this.save();
  }

  nextId(kind: keyof Store['counters']): number {
    this.counters[kind] += 1;
    return this.counters[kind];
  }

  /** Guardado diferido y atómico (archivo temporal + rename). */
  save(): void {
    if (this.remote) {
      this.dirty = true;
      return;
    }
    if (!this.file) return;
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, 120);
    this.timer.unref?.();
  }

  /** Imagen de una publicación; con Firestore se baja bajo demanda. */
  async mediaData(id: string): Promise<MediaItem | undefined> {
    const m = this.media[id];
    if (!m) return undefined;
    if (!m.b64 && this.remote) {
      const b64 = await this.remote.mediaB64(id);
      if (!b64) return undefined;
      m.b64 = b64;
    }
    return m.b64 ? m : undefined;
  }

  flush(): void {
    if (!this.file) return;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const db: DbShape = { version: 1, counters: this.counters, contents: this.contents, social: this.social, leads: this.leads, profiles: this.profiles, chats: this.chats, media: this.media, guide: this.guide, projects: this.projects, connections: this.connections };
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(db));
      fs.renameSync(tmp, this.file);
    } catch (e) {
      console.error('[store] no se pudo guardar:', (e as Error).message);
    }
  }
}

let instance: Store | null = null;

export function getStore(): Store {
  if (instance) return instance;
  const onVercel = Boolean(process.env.VERCEL);
  const explicit = process.env.DATA_FILE?.trim();
  const file = explicit || (onVercel ? '/tmp/myos-db.json' : path.join(PROJECT_ROOT, 'data', 'db.json'));
  const seed = process.env.SEED_DEMO_DATA ? process.env.SEED_DEMO_DATA !== 'false' : !isProd;
  let dbId = '';
  try {
    dbId = String(JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'firebase-applet-config.json'), 'utf8')).firestoreDatabaseId || '');
  } catch {
    /* sin config */
  }
  const remote = explicit ? null : remoteConfigFromEnv(dbId);
  instance = new Store(file, { seed, ephemeral: onVercel && !explicit, remote });
  return instance;
}

/** Solo para pruebas. */
export function resetStore(store: Store | null): void {
  instance = store;
}
