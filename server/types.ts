// Tipos compartidos del backend MYOS.

export type DesignTheme = 'dark-modern' | 'light-clean' | 'luxury-gold';

export interface GeneratedWebsite {
  titulo: string;
  site_name: string;
  industry: string;
  tagline: string;
  brand_colors: { primary: string; secondary: string; accent: string };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primary_cta: string;
    secondary_cta: string;
    trust_badges: string[];
  };
  services: Array<{ title: string; description: string; icon: string; badge?: string; image?: string }>;
  about: {
    title: string;
    content: string;
    image?: string;
    metrics: Array<{ label: string; value: string }>;
  };
  blog_posts: Array<{ title: string; excerpt: string; read_time: string; date: string }>;
  contact: { title: string; subtitle: string; phone: string; email: string; address: string };
  social_posts: {
    facebook: { copy: string; cta: string };
    instagram: { copy: string; hashtags: string };
  };
  resumen_web: string;
  copy_redes: string;
  prompt_imagen: string;
  /** Cosas que la IA supuso o inventó y que la persona que aprueba debe verificar. */
  review_notes?: string[];
  custom_logo?: string | null;
  hero_image?: string | null;
  custom_photos?: string[];
  design_theme?: DesignTheme | string;
  drive_files?: {
    pages_file: string;
    blog_file: string;
    social_file: string;
    brand_file?: string;
  };
  /** HTML autónomo generado a partir del resto de los campos. */
  full_html?: string;
}

export type ContentStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'PUBLISHED' | 'REJECTED';

export interface AuditEvent {
  at: string;
  by: string;
  action: string;
  from?: string;
  to?: string;
  note?: string;
}

export type AiErrorCode =
  | 'NO_API_KEY'
  | 'INVALID_API_KEY'
  | 'QUOTA'
  | 'MODEL_NOT_FOUND'
  | 'OVERLOADED'
  | 'SAFETY_BLOCK'
  | 'BAD_JSON'
  | 'EMPTY'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface AiAttempt {
  model: string;
  ok: boolean;
  code?: AiErrorCode;
  message?: string;
  ms: number;
}

export interface AiMeta {
  source: 'gemini' | 'fallback' | 'seed' | 'manual';
  model?: string;
  attempts: AiAttempt[];
  error?: { code: AiErrorCode; message: string; hint: string };
  duration_ms?: number;
}

export interface ContentItem {
  id: number;
  title: string;
  slug: string;
  category: string;
  status: ContentStatus;
  brief?: string;
  body_text: string;
  created_at: string;
  created_by?: string;
  project_id?: number | null;
  updated_at?: string;
  approved_at?: string | null;
  approved_by?: string | null;
  approved_by_email?: string | null;
  /** Huella SHA-256 del contenido aprobado: lo aprobado es lo que se publica. */
  approved_hash?: string | null;
  rejected_reason?: string | null;
  drive_file_id?: string;
  is_seed?: boolean;
  ai?: AiMeta;
  content?: GeneratedWebsite | any;
  history: AuditEvent[];
}

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin';
export type SocialStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'FAILED'
  | 'REJECTED';

export interface PublishResult {
  mode: 'webhook' | 'graph' | 'dry-run';
  ok: boolean;
  at: string;
  http_status?: number;
  external_id?: string;
  error?: string;
  note?: string;
}

export interface SocialPost {
  id: number;
  site_id: number | null;
  site_name?: string;
  platform: SocialPlatform;
  copy: string;
  hashtags: string;
  cta: string;
  link_url: string;
  image_url: string;
  image_prompt?: string;
  /** Texto corto para la pieza gráfica (se dibuja en el navegador). */
  image_headline?: string;
  image_subline?: string;
  has_media?: boolean;
  scheduled_at: string | null;
  status: SocialStatus;
  created_at: string;
  created_by: string;
  updated_at: string;
  approved_at?: string | null;
  approved_by?: string | null;
  approved_by_email?: string | null;
  approved_hash?: string | null;
  rejected_reason?: string | null;
  published_at?: string | null;
  publish_result?: PublishResult | null;
  last_dry_run?: PublishResult | null;
  /** Proyecto al que pertenece (cada persona puede tener varios). */
  project_id?: number | null;
  /** Versiones anteriores del texto, para volver atrás después de pedir cambios a la IA. */
  versions?: PostVersion[];
  /** Aprobada por una persona con «Aprobar y programar»: el programador la publica solo cuando llegue su fecha. */
  auto_publish?: boolean;
  history: AuditEvent[];
}

export interface PostVersion {
  at: string;
  copy: string;
  hashtags: string;
  cta: string;
  image_headline: string;
  image_subline: string;
  note?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
}

/** Datos para publicar de un proyecto. Los secretos se guardan cifrados y nunca se devuelven al navegador. */
export interface ProjectConnection {
  page_id: string;
  ig_user_id: string;
  webhook_url: string;
  /** Cifrado AES-256-GCM (formato iv.tag.datos en base64). */
  page_token_enc: string;
  /** Hasta que la persona lo active, todo se queda en simulación. */
  live: boolean;
  tested_at?: string | null;
  tested_ok?: boolean | null;
  test_note?: string | null;
  updated_at: string;
  updated_by: string;
}

export interface DriveNote {
  file_id: string;
  folder: string;
  name: string;
  text: string;
  at: string;
}

/** Carpeta de Google Drive de un proyecto (compartida con la cuenta de servicio). */
export interface DriveConfig {
  folder_id: string;
  folder_name: string;
  /** Ruta lógica -> id de carpeta (Marca, Sitio_Web, Redes_Sociales, Calendario, sus «Procesados», etc.). */
  folders: Record<string, string>;
  last_sync_at?: string | null;
  last_sync_note?: string | null;
  notes: DriveNote[];
  updated_at: string;
  updated_by: string;
}

export interface Lead {
  id: number;
  site_id: number | null;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  emailVerified: boolean;
  isApprover: boolean;
  via: 'firebase' | 'dev' | 'system';
  /** Proyecto activo (lo fija el servidor a partir de la cabecera x-project-id). */
  project_id?: number | null;
  /** Clave de almacenamiento del proyecto activo: correo + proyecto. */
  scope?: string;
}

export interface BusinessProfile {
  business_name: string;
  what_they_do: string;
  industry: string;
  audience: string;
  location: string;
  value_proposition: string;
  offers: string;
  tone: string;
  goals: string;
  channels: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  website: string;
  notes: string;
  brand_colors?: { primary: string; secondary: string; accent: string } | null;
  logo?: string | null;
  updated_at?: string;
}

export interface ChatAction {
  type: 'generate_site' | 'update_site';
  /** Texto con el que se genera o ajusta el sitio (viene del modelo, se guarda en el servidor). */
  brief: string;
  site_id?: number | null;
  status: 'pending' | 'done' | 'failed';
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: string;
  artifacts?: Array<{ kind: 'site' | 'post'; id: number }>;
  action?: ChatAction;
  learned?: string[];
  ai?: { model?: string };
}

export interface MediaItem {
  mime: 'image/jpeg';
  b64: string;
  sha: string;
  at: string;
}

export interface GuideReport {
  summary: string;
  sections: Array<{ heading: string; body: string }>;
}

export interface GuideStepState {
  answers: Record<string, string>;
  report: GuideReport | null;
  status: 'EMPTY' | 'DRAFT' | 'CONFIRMED';
  generated_by?: 'ai' | 'local' | 'manual';
  /** Las respuestas cambiaron después de generar la vista previa. */
  stale?: boolean;
  model?: string;
  updated_at: string;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
}
