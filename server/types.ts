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

export type SocialPlatform = 'facebook' | 'instagram';
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
  history: AuditEvent[];
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
  via: 'firebase' | 'dev';
}
