import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { timingSafeEqual } from 'node:crypto';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

export interface GeneratedWebsite {
  titulo: string;
  site_name: string;
  industry: string;
  tagline: string;
  custom_logo?: string;
  hero_image?: string;
  brand_colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primary_cta: string;
    secondary_cta: string;
    trust_badges: string[];
  };
  services: Array<{
    title: string;
    description: string;
    icon: string;
    badge?: string;
  }>;
  about: {
    title: string;
    content: string;
    image?: string;
    metrics: Array<{
      label: string;
      value: string;
    }>;
  };
  blog_posts: Array<{
    title: string;
    excerpt: string;
    read_time: string;
    date: string;
  }>;
  contact: {
    title: string;
    subtitle: string;
    phone: string;
    email: string;
    address: string;
  };
  social_posts: {
    facebook: {
      copy: string;
      cta: string;
    };
    instagram: {
      copy: string;
      hashtags: string;
    };
  };
  resumen_web: string;
  copy_redes: string;
  prompt_imagen: string;
  drive_files?: {
    pages_file: string;
    blog_file: string;
    social_file: string;
  };
}

interface ContentItem {
  id: number;
  title: string;
  slug: string;
  category: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PUBLISHED';
  brief?: string;
  body_text: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  approved_by_email?: string;
  drive_file_id?: string;
  content?: GeneratedWebsite | any;
}

let nextId = 3;

// In-memory seeded content aligned with IOT Technologies manual and Merkatics platform
const contents: ContentItem[] = [
  {
    id: 1,
    title: 'Transformación Digital para PyMEs con IoT',
    slug: 'transformacion-digital-iot',
    category: 'PÁGINA WEB / REDES',
    status: 'PENDING',
    body_text: 'Implementación de sensores conectados, analítica en tiempo real y dispositivos inteligentes para optimizar procesos operativos y reducir costos en medianas y grandes empresas.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    drive_file_id: 'drive_001_iot_intro',
    content: {
      titulo: 'Transformación Digital para PyMEs con IoT',
      site_name: 'IOT Technologies Connect',
      industry: 'Tecnología, Sensores e Industria 4.0',
      tagline: 'Telemetría y Automatización Industrial para PyMEs',
      brand_colors: { primary: '#1d7eae', secondary: '#0032a0', accent: '#98dae9' },
      hero_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      hero: {
        badge: '🚀 Soluciones IoT Certificadas • Ficha 2026-544-11',
        title: 'Monitoreo en Tiempo Real y Telemetría Industrial para PyMEs',
        subtitle: 'Conectamos tu maquinaria e infraestructura con sensores seguros y tableros interactivos para reducir costos operativos hasta un 35%.',
        primary_cta: 'Solicitar Demostración Técnica',
        secondary_cta: 'Ver Sensores & Catálogo',
        trust_badges: ['Atención en Cd. Juárez & El Paso', 'Sensores de Grado Industrial', 'Soporte 24/7']
      },
      services: [
        { title: 'Sensores de Temperatura y Presión', description: 'Monitoreo continuo de cuartos fríos y líneas de producción crítica con alertas instantáneas.', icon: 'Cpu', badge: 'Más Solicitado' },
        { title: 'Telemetría de Flotillas y Rutas', description: 'Rastreo satelital con diagnóstico OBD-II y control de combustible en la franja fronteriza.', icon: 'Network', badge: 'Alta Demanda' },
        { title: 'Tableros de Business Intelligence', description: 'Visualización gerencial en tiempo real con integración directa a sistemas ERP.', icon: 'BarChart3', badge: 'Ejecutivo' }
      ],
      about: {
        title: 'Ingeniería Fronteriza con Alcance Binacional',
        content: 'Con sede en Ciudad Juárez y El Paso, TX, IOT Technologies desarrolla soluciones tecnológicas de vanguardia para la industria manufacturera, logística y comercial de la región.',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        metrics: [
          { label: 'Sensores Activos', value: '+4,200' },
          { label: 'Disponibilidad de Red', value: '99.98%' },
          { label: 'Años de Experiencia', value: '12+' }
        ]
      },
      blog_posts: [
        { title: 'Cómo el IoT previene paros de línea en maquiladoras', excerpt: 'Estrategias de mantenimiento predictivo mediante vibración y temperatura.', read_time: '4 min', date: 'Esta semana' },
        { title: 'Integración de telemetría a bajo costo para flotillas', excerpt: 'Casos de éxito de transportistas en Ciudad Juárez y Chihuahua.', read_time: '3 min', date: 'Hace unos días' }
      ],
      contact: {
        title: 'Agenda una Demostración en tu Planta',
        subtitle: 'Ingenieros certificados visitan tus instalaciones sin compromiso.',
        phone: '+52 (656) 626-9124',
        email: 'contacto@iottechnologies.mx',
        address: 'Benjamin Franklin 3220 5E, Ciudad Juárez, Chih.'
      },
      social_posts: {
        facebook: { copy: 'Optimiza la operación de tu planta con sensores IoT industriales.', cta: 'Agendar Cita' },
        instagram: { copy: 'Monitoreo industrial en tiempo real. #IoT #Industria40 #Juarez', hashtags: '#IoT #Tech #Automatizacion' }
      },
      resumen_web: 'Plataforma corporativa de sensores y telemetría industrial con soporte binacional en Juárez y El Paso.'
    }
  },
  {
    id: 2,
    title: 'Business Intelligence: De Datos a Decisiones Estratégicas',
    slug: 'business-intelligence-decisiones',
    category: 'PÁGINA WEB / REDES',
    status: 'PENDING',
    body_text: 'Tableros interactivos e integración de fuentes de datos dispersas para empoderar a la alta dirección con métricas accionables en minutos y visualización ejecutiva en alta fidelidad.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    drive_file_id: 'drive_002_bi_platform',
    content: {
      titulo: 'Business Intelligence: De Datos a Decisiones Estratégicas',
      site_name: 'Merkatics BI Executive',
      industry: 'Analítica de Datos & Inteligencia Comercial',
      tagline: 'Tableros Ejecutivos y Métricas Accionables',
      brand_colors: { primary: '#0284c7', secondary: '#0f172a', accent: '#7dd3fc' },
      hero_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      hero: {
        badge: '📊 Analítica Avanzada en Tiempo Real',
        title: 'Convierte tus Datos Dispersos en Decisiones Rentables',
        subtitle: 'Unificamos tus hojas de cálculo, ventas y almacén en tableros ejecutivos interactivos que tu equipo puede entender en segundos.',
        primary_cta: 'Ver Tablero Demo',
        secondary_cta: 'Conocer Metodología',
        trust_badges: ['Métricas 100% Claras', 'Conexión Segura en la Nube', 'Capacitación Incluida']
      },
      services: [
        { title: 'Tableros Financieros en Tiempo Real', description: 'Flujo de caja, rentabilidad por línea de negocio y proyecciones automáticas.', icon: 'BarChart3', badge: 'Clave' },
        { title: 'Inteligencia de Clientes y Ventas', description: 'Segmentación de compradores, tasa de retención y embudos comerciales.', icon: 'Users', badge: 'Comercial' },
        { title: 'Automatización de Reportes Semanales', description: 'Envío automático por correo a directores y gerentes todos los lunes a primera hora.', icon: 'TrendingUp', badge: 'Ahorro de Tiempo' }
      ],
      about: {
        title: 'Pasión por la Claridad y la Rentabilidad',
        content: 'En Merkatics ayudamos a directores y dueños de negocio a eliminar la incertidumbre en sus operaciones financieras y comerciales.',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        metrics: [
          { label: 'Horas Ahorradas al Mes', value: '+120 hrs' },
          { label: 'Precisión de Reportes', value: '100%' },
          { label: 'Retorno de Inversión', value: '4.8x' }
        ]
      },
      blog_posts: [
        { title: 'Los 5 KPIs financieros que todo dueño de negocio debe revisar', excerpt: 'Cómo medir la liquidez y margen sin enredarse en términos contables.', read_time: '3 min', date: 'Esta semana' },
        { title: 'De Excel a Power BI: el salto que multiplicó ventas', excerpt: 'Guía práctica para migrar hojas de cálculo a tableros en la nube.', read_time: '5 min', date: 'Hace unos días' }
      ],
      contact: {
        title: 'Inicia con un Diagnóstico de Datos Gratuito',
        subtitle: 'Analizamos tus fuentes de datos actuales y te mostramos cómo optimizarlas.',
        phone: '+52 (656) 555-0188',
        email: 'contacto@merkatics.com',
        address: 'Parque de Negocios Corporativo'
      },
      social_posts: {
        facebook: { copy: 'Toma decisiones con números reales, no corazonadas.', cta: 'Solicitar Demo' },
        instagram: { copy: 'Tableros ejecutivos en alta definición. #Data #BI #Negocios', hashtags: '#BusinessIntelligence #Analytics #PyME' }
      },
      resumen_web: 'Solución integral de Business Intelligence y tableros en tiempo real para alta dirección.'
    }
  }
];

// Helper: Generador de página web completa autónoma en HTML5 + Tailwind CSS
export function generateStandaloneHtml(site: GeneratedWebsite): string {
  const primary = site.brand_colors?.primary || '#E95349';
  const secondary = site.brand_colors?.secondary || '#C6443F';
  const siteName = site.site_name || site.titulo || 'Mi Negocio';
  const tagline = site.tagline || 'Soluciones de Alta Conversión';

  const servicesHtml = (site.services || []).map((s: any, idx: number) => `
    <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg group">
      ${s.image ? `<div class="mb-4 rounded-xl overflow-hidden h-40 bg-slate-950 border border-slate-800"><img src="${s.image}" alt="${s.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" /></div>` : ''}
      <div class="flex justify-between items-start mb-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg" style="background-color: ${primary}20; color: ${primary};">
          ${idx + 1}
        </div>
        ${s.badge ? `<span class="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">${s.badge}</span>` : ''}
      </div>
      <h3 class="text-lg font-bold text-white mb-2">${s.title}</h3>
      <p class="text-sm text-slate-400 leading-relaxed">${s.description}</p>
    </div>
  `).join('');

  const metricsHtml = (site.about?.metrics || []).map(m => `
    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
      <div class="text-2xl font-black mb-1" style="color: ${primary};">${m.value}</div>
      <div class="text-xs text-slate-400 font-medium">${m.label}</div>
    </div>
  `).join('');

  const trustBadgesHtml = (site.hero?.trust_badges || []).map(b => `
    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
      <span class="text-emerald-400">✓</span> ${b}
    </span>
  `).join('');

  const blogHtml = (site.blog_posts || []).map(post => `
    <article class="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
      <span class="text-xs text-slate-500 font-mono block mb-2">${post.date || 'Reciente'} • ${post.read_time || '3 min'}</span>
      <h3 class="text-lg font-bold text-white mb-2">${post.title}</h3>
      <p class="text-sm text-slate-400 leading-relaxed mb-4">${post.excerpt}</p>
      <a href="#contacto" class="text-xs font-bold inline-flex items-center gap-1 hover:underline" style="color: ${primary};">Leer artículo →</a>
    </article>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName} — ${tagline}</title>
  <meta name="description" content="${site.resumen_web || tagline}">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      color-scheme: light;
      --myos-primary: ${primary};
      --myos-secondary: ${secondary};
      --myos-accent: ${site.brand_colors?.accent || primary};
    }
    html { scroll-behavior: smooth; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    input, textarea, select { max-width: 100%; }
    img { max-width: 100%; }
    a, button { transition: opacity .2s ease, transform .2s ease; }
    a:hover, button:hover { opacity: .94; }
    :focus-visible { outline: 3px solid var(--myos-accent); outline-offset: 3px; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 antialiased selection:bg-[#1d7eae] selection:text-white">
  <!-- Barra de navegación -->
  <header class="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
    <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
      <a href="#inicio" class="flex items-center gap-2.5">
        ${site.custom_logo ? `
          <img src="${site.custom_logo}" alt="${siteName}" class="h-9 max-w-[150px] object-contain rounded bg-white/5 p-1 border border-slate-800" />
        ` : `
          <div class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md" style="background: linear-gradient(135deg, ${primary}, ${secondary});">
            ${siteName.charAt(0)}
          </div>
        `}
        <div>
          <span class="font-extrabold text-base tracking-tight text-white block leading-tight">${siteName}</span>
          <span class="text-[10px] text-slate-400 block leading-none">${site.industry || 'PyME'}</span>
        </div>
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
        <a href="#inicio" class="hover:text-white transition">Inicio</a>
        <a href="#servicios" class="hover:text-white transition">Servicios</a>
        <a href="#nosotros" class="hover:text-white transition">Nosotros</a>
        <a href="#blog" class="hover:text-white transition">Blog</a>
        <a href="#contacto" class="hover:text-white transition">Contacto</a>
      </nav>
      <a href="#contacto" class="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition hover:opacity-95" style="background: linear-gradient(135deg, ${primary}, ${secondary});">
        ${site.hero?.primary_cta || 'Contactar'}
      </a>
    </div>
  </header>

  <!-- Hero Section -->
  <section id="inicio" class="relative pt-20 pb-24 px-6 overflow-hidden">
    <div class="max-w-4xl mx-auto text-center space-y-6">
      ${site.hero?.badge ? `
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-200">
        <span>✨</span> <span>${site.hero.badge}</span>
      </div>` : ''}
      <h1 class="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight">
        ${site.hero?.title || site.titulo}
      </h1>
      <p class="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
        ${site.hero?.subtitle || site.resumen_web}
      </p>
      <div class="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
        <a href="#contacto" class="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white shadow-xl transition hover:opacity-95 text-sm" style="background: linear-gradient(135deg, ${primary}, ${secondary});">
          ${site.hero?.primary_cta || 'Comenzar Ahora'}
        </a>
        <a href="#servicios" class="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 transition text-sm">
          ${site.hero?.secondary_cta || 'Conocer Más'}
        </a>
      </div>
      <div class="flex flex-wrap justify-center gap-2.5 pt-6">
        ${trustBadgesHtml}
      </div>
      ${site.hero_image ? `
      <div class="mt-8 max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 group">
        <img src="${site.hero_image}" alt="${siteName}" class="w-full max-h-[440px] object-cover group-hover:scale-102 transition duration-500" />
      </div>` : ''}
    </div>
  </section>

  <!-- Servicios -->
  <section id="servicios" class="py-20 px-6 bg-slate-900/50 border-y border-slate-800/80">
    <div class="max-w-6xl mx-auto space-y-12">
      <div class="text-center space-y-2 max-w-xl mx-auto">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Soluciones Integrales</span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-white">Nuestros Servicios de Especialidad</h2>
        <p class="text-sm text-slate-400">Diseñados a la medida para garantizar satisfacción y resultados concretos.</p>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${servicesHtml}
      </div>
    </div>
  </section>

  <!-- Nosotros -->
  <section id="nosotros" class="py-20 px-6">
    <div class="max-w-4xl mx-auto space-y-10">
      <div class="text-center space-y-3">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Trayectoria & Misión</span>
        <h2 class="text-3xl font-extrabold text-white">${site.about?.title || 'Nuestra Propuesta de Valor'}</h2>
        ${site.about?.image ? `
        <div class="rounded-2xl overflow-hidden border border-slate-800 shadow-xl max-w-lg mx-auto mb-4">
          <img src="${site.about.image}" alt="Nosotros" class="w-full max-h-64 object-cover" />
        </div>` : ''}
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-sm sm:text-base leading-relaxed text-left whitespace-pre-line">
          ${site.about?.content || site.resumen_web}
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        ${metricsHtml}
      </div>
    </div>
  </section>

  <!-- Blog -->
  <section id="blog" class="py-20 px-6 bg-slate-900/50 border-y border-slate-800/80">
    <div class="max-w-6xl mx-auto space-y-10">
      <div class="text-center space-y-2 max-w-xl mx-auto">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Artículos & Recursos</span>
        <h2 class="text-3xl font-extrabold text-white">Blog & Novedades</h2>
        <p class="text-sm text-slate-400">Consejos y recomendaciones de expertos de la industria.</p>
      </div>
      <div class="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        ${blogHtml}
      </div>
    </div>
  </section>

  <!-- Contacto -->
  <section id="contacto" class="py-20 px-6">
    <div class="max-w-3xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-10 space-y-8 shadow-2xl">
      <div class="text-center space-y-2">
        <h2 class="text-3xl font-extrabold text-white">${site.contact?.title || 'Ponte en Contacto'}</h2>
        <p class="text-sm text-slate-400">${site.contact?.subtitle || 'Envíanos un mensaje o agenda directamente.'}</p>
      </div>
      <form onsubmit="event.preventDefault(); alert('¡Gracias! Hemos recibido tu solicitud y nos pondremos en contacto a la brevedad.');" class="space-y-4">
        <div class="grid sm:grid-cols-2 gap-4">
          <input type="text" required placeholder="Tu Nombre Completo" class="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[${primary}]">
          <input type="tel" required placeholder="Teléfono / WhatsApp" class="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[${primary}]">
        </div>
        <input type="email" required placeholder="Correo Electrónico" class="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[${primary}]">
        <textarea rows="4" required placeholder="¿En qué podemos ayudarte?" class="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[${primary}]"></textarea>
        <button type="submit" class="w-full py-4 rounded-xl font-bold text-white shadow-lg transition hover:opacity-95 text-sm" style="background: linear-gradient(135deg, ${primary}, ${secondary});">
          Enviar Mensaje
        </button>
      </form>
      <div class="pt-4 border-t border-slate-800/80 grid sm:grid-cols-3 gap-4 text-xs text-slate-400 text-center">
        <div>📍 <strong>Ubicación:</strong><br>${site.contact?.address || 'Ciudad Juárez'}</div>
        <div>📞 <strong>Teléfono:</strong><br>${site.contact?.phone || '+52 (656) 000-0000'}</div>
        <div>✉️ <strong>Correo:</strong><br>${site.contact?.email || 'contacto@empresa.com'}</div>
      </div>
    </div>
  </section>

  <!-- Botón flotante WhatsApp -->
  <a href="https://wa.me/526561234567?text=Hola,%20vi%20su%20sitio%20web%20y%20me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n" target="_blank" rel="noopener noreferrer" class="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl flex items-center justify-center transition transform hover:scale-110 z-50">
    <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.771.88 2.796.88 3.179 0 5.767-2.587 5.767-5.766.001-3.187-2.575-5.767-5.767-5.767zm0 10.428c-.887 0-1.593-.243-2.316-.672l-.166-.098-1.58.415.422-1.541-.107-.171c-.482-.767-.736-1.554-.735-2.595.001-2.459 2.003-4.461 4.466-4.461 2.464 0 4.467 2.002 4.467 4.461 0 2.464-2.003 4.462-4.467 4.462z"/>
    </svg>
  </a>

  <!-- Footer -->
  <footer class="py-8 text-center text-xs text-slate-500 border-t border-slate-900 bg-slate-950">
    <p>© 2026 ${siteName}. Todos los derechos reservados. Generado con Plataforma MYOS (Merkatics).</p>
  </footer>
</body>
</html>`;
}

// Helper: Smart contextual content generator for fallback
function generateSmartContent(brief: string, options: any = {}): GeneratedWebsite {
  const cleanBrief = brief.trim();
  const lower = cleanBrief.toLowerCase();
  const previousSite = options.previousSite || null;

  // Si el usuario está pidiendo cambios o ajustes sobre una web previamente generada
  if (previousSite && (previousSite.site_name || previousSite.titulo)) {
    const updated = JSON.parse(JSON.stringify(previousSite));

    if (lower.includes('dorad') || lower.includes('oro') || lower.includes('gold')) {
      updated.brand_colors = { primary: '#d97706', secondary: '#78350f', accent: '#fde68a' };
    } else if (lower.includes('verde') || lower.includes('menta') || lower.includes('eco')) {
      updated.brand_colors = { primary: '#059669', secondary: '#047857', accent: '#a7f3d0' };
    } else if (lower.includes('naranja') || lower.includes('fuego')) {
      updated.brand_colors = { primary: '#ea580c', secondary: '#9a3412', accent: '#fed7aa' };
    } else if (lower.includes('morad') || lower.includes('púrpura') || lower.includes('purpura')) {
      updated.brand_colors = { primary: '#7c3aed', secondary: '#5b21b6', accent: '#ddd6fe' };
    } else if (lower.includes('rosa') || lower.includes('pastel')) {
      updated.brand_colors = { primary: '#db2777', secondary: '#9d174d', accent: '#fbcfe8' };
    } else if (lower.includes('rojo') || lower.includes('vino')) {
      updated.brand_colors = { primary: '#dc2626', secondary: '#991b1b', accent: '#fca5a5' };
    } else if (lower.includes('azul')) {
      updated.brand_colors = { primary: '#1d7eae', secondary: '#0032a0', accent: '#98dae9' };
    }

    if (lower.includes('claro') || lower.includes('blanco') || lower.includes('minimal')) {
      updated.design_theme = 'light-clean';
    } else if (lower.includes('lujo') || lower.includes('dorad')) {
      updated.design_theme = 'luxury-gold';
    }

    const nameMatch = cleanBrief.match(/(?:llame|llamada|nombre|marca)\s+([A-Za-z0-9Á-ÿ\s&]+?)(?:,|\.|\s+y|\s+con|$)/i);
    if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2) {
      const newName = nameMatch[1].trim();
      updated.site_name = newName;
      updated.titulo = `Sitio Web: ${newName}`;
    }

    if (lower.includes('%') || lower.includes('descuento') || lower.includes('promocion') || lower.includes('promoción')) {
      updated.hero.badge = '🔥 ¡Promoción Especial Activa por Tiempo Limitado!';
      updated.hero.primary_cta = 'Aprovechar Promoción';
    }

    if (lower.includes('domicilio') || lower.includes('envio') || lower.includes('envío') || lower.includes('entrega')) {
      updated.hero.trust_badges = Array.from(new Set([...(updated.hero.trust_badges || []), 'Envíos Rápidos a Domicilio', 'Entrega Segura']));
    }

    return updated;
  }

  // 1. Veterinarias, Animales, Perros, Gatos, Estética Canina y Spa de Mascotas
  if (
    lower.includes('veterinaria') ||
    lower.includes('mascota') ||
    lower.includes('perro') ||
    lower.includes('gato') ||
    lower.includes('canin') ||
    lower.includes('felin') ||
    lower.includes('animal')
  ) {
    const isUrgencias = lower.includes('24') || lower.includes('urgencia') || lower.includes('hospital');
    const siteName = isUrgencias ? 'VetCare 24/7 - Hospital Veterinario & Especialidades' : 'PetLife - Clínica Veterinaria & Spa Canino';
    return {
      titulo: `${siteName}: Cuidado Experto, Amor y Medicina Preventiva para tu Mascota`,
      site_name: siteName,
      industry: 'Medicina Veterinaria, Hospitalización & Spa de Mascotas',
      tagline: 'La salud, bienestar y felicidad de tu mejor amigo en manos de médicos veterinarios apasionados y certificados.',
      brand_colors: {
        primary: '#059669',
        secondary: '#047857',
        accent: '#d1fae5'
      },
      hero: {
        badge: isUrgencias ? '🚨 Urgencias 24 Horas & Hospitalización' : '🐾 Cuidado y Amor Incondicional para tu Mascota',
        title: 'Atención Médica Veterinaria de Calidad con Tecnología Avanzada',
        subtitle: 'Consulta general y de especialidad, cirugías seguras, laboratorio clínico propio, estética canina profesional y farmacia veterinaria completa.',
        primary_cta: 'Agendar Cita o Consulta',
        secondary_cta: 'Servicio de Urgencias 24/7',
        trust_badges: ['Médicos Certificados', 'Laboratorio & Rayos X en Sitio', 'Monitoreo 24 Horas']
      },
      services: [
        {
          title: 'Consulta Médica & Vacunación',
          description: 'Medicina preventiva, desparasitación, esquemas completos de cachorros y chequeos geriátricos.',
          icon: 'ShieldCheck',
          badge: 'Preventivo'
        },
        {
          title: 'Cirugía de Tejidos Blandos & Quirófano',
          description: 'Esterilizaciones seguras, monitoreo anestésico multiparamétrico y recuperación supervisada.',
          icon: 'Sparkles',
          badge: 'Quirófano Pro'
        },
        {
          title: 'Estética Canina & Spa Relajante',
          description: 'Baños medicados, corte de raza, limpieza dental no invasiva y corte de uñas con amor.',
          icon: 'Heart',
          badge: 'Consentidos'
        }
      ],
      about: {
        title: 'Pasión por la Vida Animal y Calidez Humana',
        content: `En ${siteName} entendemos que tu mascota es un miembro indispensable de tu familia. Por eso, diseñamos un espacio libre de estrés donde cada perro y gato recibe trato amoroso, paciencia y diagnósticos basados en evidencia médica.\n\nContamos con quirófano moderno y área de hospitalización aislada para perros y gatos.`,
        metrics: [
          { label: 'Mascotas Sanadas', value: '+12,400' },
          { label: 'Cirugías Exitosas', value: '99.9%' },
          { label: 'Años Cuidando Mascotas', value: '10 Años' }
        ]
      },
      blog_posts: [
        {
          title: 'Signos de Alarma: Cuándo Llevar a tu Perro o Gato al Veterinario de Emergencia',
          excerpt: 'Aprende a reconocer síntomas críticos como vómito persistente, letargo súbito o dificultad respiratoria.',
          read_time: '4 min',
          date: 'Esta semana'
        },
        {
          title: 'Guía de Vacunación y Desparasitación Anual para Mascotas Felices',
          excerpt: 'Por qué los refuerzos anuales protegen a toda tu familia contra enfermedades zoonóticas.',
          read_time: '3 min',
          date: 'Hace unos días'
        }
      ],
      contact: {
        title: 'Trae a tu Mascota o Contáctanos por WhatsApp',
        subtitle: 'Atención personalizada, citas programadas y urgencias médicas.',
        phone: '+52 (656) 880-9911',
        email: 'citas@vetcare24.mx',
        address: 'Av. Paseo de la Victoria #4400, Zona Campestre'
      },
      social_posts: {
        facebook: {
          copy: '🐶 ¡En VetCare consentimos a tu mejor amigo como se merece! Ya sea para su vacuna, chequeo general o día de spa en estética canina, nuestro equipo médico está listo para recibirlo con los brazos abiertos.\n\n📍 Agenda tu cita por WhatsApp.',
          cta: 'Agendar Consulta'
        },
        instagram: {
          copy: 'La mirada de agradecimiento de una mascota sana no tiene precio. ✨🐾 Cuidamos su corazón, su piel y su alegría todos los días.',
          hashtags: '#Veterinaria #AmorPerruno #CuidadoMascotas #Gatitos #VetCare #SaludAnimal'
        }
      },
      resumen_web: `En ${siteName} brindamos atención integral a mascotas con servicios médicos preventivos, quirúrgicos y de estética canina con los más altos estándares hospitalarios y calidez humana.`,
      copy_redes: '🐾 Cuidado veterinario especializado con tecnología y amor para tu mascota. ¡Agenda hoy mismo!',
      prompt_imagen: 'Fotografía publicitaria profesional de veterinario joven y empático examinando a un perro labrador dorado feliz y sano en clínica veterinaria moderna e iluminada, tonos verdes esmeralda y blanco limpio, calidad 8k.'
    };
  }

  // 1. Cafeterías, Restaurantes y Gastronomía
  if (
    lower.includes('cafeteria') ||
    lower.includes('café') ||
    lower.includes('cafe') ||
    lower.includes('restaurante') ||
    lower.includes('comida') ||
    lower.includes('panaderia') ||
    lower.includes('bar')
  ) {
    return {
      titulo: 'Cafetería de Especialidad: Aroma, Tradición y Experiencia Gourmet',
      site_name: 'Aroma & Grano - Specialty Coffee',
      industry: 'Gastronomía & Cafetería de Especialidad',
      tagline: 'El ritual del café de altura tostado artesanalmente para inspirar tus mejores momentos.',
      brand_colors: {
        primary: '#b45309',
        secondary: '#78350f',
        accent: '#fef3c7'
      },
      hero: {
        badge: '☕ Granos 100% de Origen Único',
        title: 'Despierta tus sentidos con el mejor café de especialidad de la ciudad',
        subtitle: 'Tostado artesanalmente cada semana, extracciones con baristas certificados y repostería gourmet recién horneada en un ambiente diseñado para inspirarte.',
        primary_cta: 'Ver Nuestro Menú & Promociones',
        secondary_cta: 'Visítanos o Pide para Llevar',
        trust_badges: ['Granos Éticos & Orgánicos', 'Wi-Fi de Alta Velocidad', 'Baristas Certificados']
      },
      services: [
        {
          title: 'Barra de Extracciones de Especialidad',
          description: 'V60, Chemex, Aeropress y espresso con perfiles de notas florales y achocolatadas.',
          icon: 'Coffee',
          badge: 'Estrella de la Casa'
        },
        {
          title: 'Repostería Francesa Artesanal',
          description: 'Croissants de mantequilla, tartas de frutos rojos y panes horneados cada mañana.',
          icon: 'Sparkles',
          badge: 'Recién Horneado'
        },
        {
          title: 'Espacio Co-Working & Reuniones',
          description: 'Mesas con tomas de corriente, iluminación natural y ambiente acústico relajado.',
          icon: 'Users',
          badge: 'Wi-Fi Gratuito'
        }
      ],
      about: {
        title: 'Nuestra Pasión por el Grano Perfecto',
        content: 'Nacimos con la misión de democratizar el café de alta especialidad. Trabajamos directamente con pequeños productores en regiones montañosas para garantizar comercio justo y frescura insuperable en cada taza.\n\nCreemos que una buena taza de café tiene el poder de conectar ideas y transformar el día de quien la disfruta.',
        metrics: [
          { label: 'Tazas Servidas con Pasión', value: '+45,000' },
          { label: 'Variedades de Grano Único', value: '12 Orígenes' },
          { label: 'Clientes Satisfechos', value: '99.4%' }
        ]
      },
      blog_posts: [
        {
          title: 'Guía Rápida: Diferencias entre Cold Brew y Café Helado Tradicional',
          excerpt: 'Descubre por qué la extracción en frío durante 18 horas produce una bebida con menor acidez y dulzor natural superior.',
          read_time: '3 min',
          date: 'Esta semana'
        },
        {
          title: 'El Arte del Maridaje: Qué café elegir según tu postre favorito',
          excerpt: 'Aprende a combinar cafés cítricos con repostería de chocolate oscuro para una experiencia de sabor inolvidable.',
          read_time: '4 min',
          date: 'Hace unos días'
        }
      ],
      contact: {
        title: 'Ven a Disfrutar el Ritual del Café',
        subtitle: 'Abierto todos los días de 7:30 AM a 10:00 PM. ¡Te esperamos!',
        phone: '+52 (656) 456-7890',
        email: 'hola@aromaygrano.com',
        address: 'Calle Primavera #402, Zona Dorada, Ciudad Juárez'
      },
      social_posts: {
        facebook: {
          copy: '☕ ¿Listo para tu próxima pausa perfecta? En Aroma & Grano preparamos café de especialidad con granos de altura, extracciones precisas y el toque dulce de nuestra repostería recién horneada.\n\n📍 Te esperamos todos los días con el mejor ambiente y aroma de la ciudad.\n\n👉 ¡Ven por tu favorito o pide para llevar!',
          cta: 'Ver Menú y Ubicación'
        },
        instagram: {
          copy: 'El secreto de una gran mañana está en los detalles: notas achocolatadas, crema sedosa y el sonido de una extracción perfecta. ✨\n\n¿Ya probaste nuestro Flat White con leche vaporizada a temperatura óptima?\n\nTe esperamos para consentirte.',
          hashtags: '#CafeDeEspecialidad #CoffeeLover #CafeteriaArtesanal #BrunchTime #CoffeeTime #ExperienciaGourmet'
        }
      },
      resumen_web: 'Bienvenido a Aroma & Grano. Seleccionamos granos de origen único, tostados artesanalmente a la perfección para brindarle notas aromáticas inigualables en un ambiente acogedor diseñado para inspirar sus mejores momentos.\n\nDisfrute de nuestra selecta barra de café de especialidad, repostería artesanal recién horneada y un menú balanceado.',
      copy_redes: '☕ ¿Listo para tu próxima pausa perfecta?\n\nEn Aroma & Grano preparamos café de especialidad con granos de altura y repostería artesanal.\n\n📍 Visítanos hoy.\n\n#CafeDeEspecialidad #CoffeeLover',
      prompt_imagen: 'Fotografía publicitaria profesional de una taza de café latte con latte art refinado en taza de cerámica artesanal sobre mesa de madera rústica, granos de café tostados dispersos con elegancia, luz natural cálida de mañana entrando por un ventanal de cafetería moderna, estilo editorial 8k.',
      drive_files: {
        pages_file: '/Sitio_Web/Paginas/aroma_grano_landing.json',
        blog_file: '/Sitio_Web/Blog/guia_cold_brew.md',
        social_file: '/Redes_Sociales/Para_Publicar/aroma_grano_campaña.json'
      }
    };
  }

  // 2. Salud, Fitness, Deporte y Clínicas
  if (
    lower.includes('gimnasio') ||
    lower.includes('gym') ||
    lower.includes('fitness') ||
    lower.includes('salud') ||
    lower.includes('spa') ||
    lower.includes('clinica') ||
    lower.includes('dental') ||
    lower.includes('medico')
  ) {
    return {
      titulo: 'Clínica & Bienestar: Atención Médica Humanizada y Resultados Reales',
      site_name: 'Sonrisas & Salud Pro',
      industry: 'Salud, Odontología y Cuidado Integral',
      tagline: 'Tu salud y tranquilidad en manos de especialistas certificados con tecnología de punta.',
      brand_colors: {
        primary: '#0284c7',
        secondary: '#0369a1',
        accent: '#e0f2fe'
      },
      hero: {
        badge: '🩺 Diagnóstico Integral Sin Costo',
        title: 'Recupera tu confianza y bienestar con atención médica de primer nivel',
        subtitle: 'Instalaciones modernas, especialistas certificados en cada área y tratamientos personalizados sin dolor pensados para toda tu familia.',
        primary_cta: 'Agendar Consulta de Valoración',
        secondary_cta: 'Conocer Especialistas y Tratamientos',
        trust_badges: ['Certificación Sanitaria', 'Tecnología Láser Sin Dolor', 'Planes de Pago Flexibles']
      },
      services: [
        {
          title: 'Odontología Estética y Ortodoncia',
          description: 'Diseño de sonrisa digital, alineadores invisibles y blanqueamiento seguro de alta duración.',
          icon: 'Sparkles',
          badge: 'Más Solicitado'
        },
        {
          title: 'Implantes y Rehabilitación Oral',
          description: 'Restauración funcional y estética permanente con materiales biocompatibles de grado médico.',
          icon: 'ShieldCheck',
          badge: 'Garantía 5 Años'
        },
        {
          title: 'Odontopediatría y Cuidado Familiar',
          description: 'Ambiente amigable y técnicas no invasivas para que los niños disfruten su visita al dentista.',
          icon: 'Heart',
          badge: 'Para Niños'
        }
      ],
      about: {
        title: 'Compromiso Ético y Tecnología Avanzada',
        content: 'Con más de 12 años transformando vidas, combinamos la calidez humana con equipamiento de radiología digital 3D y esterilización hospitalaria.\n\nNos aseguramos de que cada paciente comprenda con transparencia su tratamiento y reciba seguimiento integral durante todo su proceso.',
        metrics: [
          { label: 'Pacientes Satisfechos', value: '+8,500' },
          { label: 'Tasa de Éxito en Tratamientos', value: '99.8%' },
          { label: 'Años de Experiencia Clínica', value: '12 Años' }
        ]
      },
      blog_posts: [
        {
          title: 'Mitos y Realidades sobre los Alineadores Invisibles vs Brackets',
          excerpt: 'Todo lo que necesitas saber sobre comodidad, higiene y tiempo de tratamiento para tomar la mejor decisión.',
          read_time: '4 min',
          date: 'Esta semana'
        },
        {
          title: '5 Consejos para Evitar la Sensibilidad Dental al Tomar Bebidas Frías',
          excerpt: 'Aprende hábitos simples para proteger tu esmalte y sonreír sin molestias.',
          read_time: '3 min',
          date: 'Hace unos días'
        }
      ],
      contact: {
        title: 'Agenda tu Cita Hoy Mismo',
        subtitle: 'Atención de Lunes a Sábado con horarios flexibles. Ubicados en zona céntrica con estacionamiento.',
        phone: '+52 (656) 789-0123',
        email: 'citas@sonrisasysalud.com',
        address: 'Av. Paseo Triunfo de la República #1820, Ciudad Juárez'
      },
      social_posts: {
        facebook: {
          copy: '✨ Tu sonrisa es tu mejor carta de presentación. En Sonrisas & Salud Pro contamos con ortodoncia invisible y diseño de sonrisa con tecnología 3D.\n\n📅 Agenda tu valoración sin costo este mes y descubre lo fácil que es sonreír con seguridad.',
          cta: 'Enviar Mensaje por WhatsApp'
        },
        instagram: {
          copy: '¿Sabías que una sonrisa sana mejora tu confianza en más del 80% en reuniones sociales y de trabajo? 🌟\n\nNuestros especialistas están listos para darte la atención que mereces sin dolor ni temores.',
          hashtags: '#SaludDental #SonrisasPerfectas #DentistaPro #OrtodonciaInvisible #CuidadoPersonal #Bienestar'
        }
      },
      resumen_web: 'Tu salud y vitalidad son tu mayor activo. Diseñamos programas personalizados con tecnología de vanguardia y profesionales certificados que te acompañan paso a paso.',
      copy_redes: '💪 El mejor momento para empezar a cuidar de ti es hoy. Descubre una metodología enfocada en tus objetivos.\n\n🔥 Agenda tu primera sesión de valoración sin costo.',
      prompt_imagen: 'Fotografía publicitaria limpia y enérgica en instalaciones médicas modernas y luminosas, odontóloga profesional sonriendo con paciente satisfecho, iluminación suave, calidad 8k.',
      drive_files: {
        pages_file: '/Sitio_Web/Paginas/sonrisas_salud_landing.json',
        blog_file: '/Sitio_Web/Blog/alineadores_invisibles.md',
        social_file: '/Redes_Sociales/Para_Publicar/campaña_salud_dental.json'
      }
    };
  }

  // 3. IoT, Industria 4.0 o Sensores (Solo si se menciona explícitamente)
  if (lower.includes('iot') || lower.includes('sensor') || lower.includes('telemetria') || lower.includes('maquiladora') || lower.includes('industrial')) {
    const siteName = 'Pulse IoT Solutions';
    const area = 'Dispositivos Conectados e Internet de las Cosas (IoT)';
    return {
      titulo: 'Plataforma de Telemetría y Sensores Conectados para la Industria',
      site_name: siteName,
      industry: area,
      tagline: 'Monitoreo inteligente en tiempo real y automatización para la industria moderna.',
      brand_colors: { primary: '#1d7eae', secondary: '#0032a0', accent: '#98dae9' },
      hero: {
        badge: '🌐 Redes de Sensores en Tiempo Real',
        title: 'Optimice sus Operaciones Industriales con Telemetría IoT',
        subtitle: 'Plataforma de alta confiabilidad diseñada para capturar variables críticas de sensores, predecir paros no programados y reducir costos operativos con soporte 24/7.',
        primary_cta: 'Solicitar Demostración Técnica',
        secondary_cta: 'Ver Arquitectura de Red',
        trust_badges: ['Disponibilidad 99.9%', 'Protocolos Criptográficos', 'Ingeniería en Sitio']
      },
      services: [
        { title: 'Monitoreo de Variables Críticas', description: 'Temperatura, vibración, presión y consumo eléctrico transmitidos por redes seguras.', icon: 'Cpu', badge: 'Tiempo Real' },
        { title: 'Tableros de Business Intelligence', description: 'Consola web ejecutiva que convierte millones de lecturas en indicadores accionables.', icon: 'BarChart3', badge: 'Alta Dirección' },
        { title: 'Alertas Tempranas y Automatización', description: 'Notificaciones automáticas a supervisores antes de que ocurra una falla crítica.', icon: 'Network', badge: 'Mantenimiento Predictivo' }
      ],
      about: {
        title: 'Ingeniería Fronteriza Orientada a Cero Paros',
        content: 'Diseñamos e implementamos infraestructura de hardware y software para maquiladoras y PyMEs industriales.\n\nNuestras soluciones resisten entornos severos y se conectan sin fricción con los sistemas ERP ya instalados en su planta.',
        metrics: [
          { label: 'Sensores en Producción', value: '+12,000' },
          { label: 'Reducción de Paros', value: '34%' },
          { label: 'Tiempo de Despliegue', value: '< 7 Días' }
        ]
      },
      blog_posts: [
        { title: 'Cómo la Telemetría IoT Salvó una Cadena de Frío Farmacéutica', excerpt: 'Caso de estudio sobre la implementación de sensores certificados en almacenes logísticos de la frontera.', read_time: '5 min', date: 'Esta semana' },
        { title: 'Protocolos de Comunicación Seguros para Sensores en Fábricas Inteligentes', excerpt: 'Comparativa entre LoRaWAN, MQTT y redes celulares privadas para telemetría industrial.', read_time: '4 min', date: 'Hace unos días' }
      ],
      contact: {
        title: 'Inicie un Piloto en su Planta',
        subtitle: 'Nuestros ingenieros evalúan sus líneas de producción sin costo.',
        phone: '+52 (656) 613-0000',
        email: 'contacto@iottechnologies.mx',
        address: 'Parque Industrial Juárez, Edificio Tecnológico 4'
      },
      social_posts: {
        facebook: { copy: '🌐 Monitoree activos críticos en tiempo real desde cualquier dispositivo con sensores IoT de alta precisión de IOT Technologies.', cta: 'Contactar a un Ingeniero' },
        instagram: { copy: '¿Sabes cuánto cuesta una hora de paro imprevisto en tu línea de producción? 💡 La telemetría en tiempo real te permite actuar antes de que la maquinaria falle.', hashtags: '#IoT #Industria40 #MonitoreoRemoto #IOTTechnologies #TransformacionDigital' }
      },
      resumen_web: 'Monitoreo de activos y telemetría de alta confiabilidad para industrias y empresas en crecimiento.',
      copy_redes: '🚀 ¡Impulsa el rendimiento de tu negocio con soluciones tecnológicas de vanguardia!',
      prompt_imagen: 'Fotografía publicitaria corporativa de tecnología industrial, sensores conectados emitiendo datos visuales en tonos azul brillante (#1d7eae) y fondo tecnológico (#231f20), realismo 8k.',
      drive_files: {
        pages_file: '/Sitio_Web/Paginas/pulse_iot_landing.json',
        blog_file: '/Sitio_Web/Blog/articulo_iot.md',
        social_file: '/Redes_Sociales/Para_Publicar/campaña_iot.json'
      }
    };
  }

  // 4. Moda, Ropa, Calzado & Tiendas E-Commerce
  if (lower.includes('ropa') || lower.includes('moda') || lower.includes('calzado') || lower.includes('zapato') || lower.includes('tenis') || lower.includes('sneaker') || lower.includes('tienda') || lower.includes('boutique')) {
    const siteName = 'Nova Concept Store - Moda & Tendencias';
    return {
      titulo: `${siteName}: Catálogo Exclusivo, Calzado y Prendas de Alta Calidad`,
      site_name: siteName,
      industry: 'Moda, Indumentaria Urbana & Comercio Electrónico',
      tagline: 'Prendas exclusivas, calzado premium y accesorios diseñados para resaltar tu estilo único.',
      brand_colors: { primary: '#be185d', secondary: '#9d174d', accent: '#fce7f3' },
      hero: {
        badge: '✨ Nueva Colección Temporada 2026',
        title: 'Estilo, Calidad y Tendencias Diseñadas para tu Personalidad',
        subtitle: 'Descubre nuestra selección curada de prendas modernas, calzado exclusivo y accesorios con envíos rápidos y garantía de satisfacción.',
        primary_cta: 'Explorar Catálogo',
        secondary_cta: 'Ver Promociones',
        trust_badges: ['Envíos Rápidos a Todo el País', 'Cambios Sin Complicaciones', 'Prendas 100% Originales']
      },
      services: [
        { title: 'Colecciones de Tendencia & Streetwear', description: 'Prendas con cortes modernos, telas de alta durabilidad y diseños que marcan la pauta.', icon: 'Sparkles', badge: 'Nuevo' },
        { title: 'Calzado & Sneakers Exclusivos', description: 'Tenis y calzado casual de marcas destacadas con máxima comodidad y ergonomía.', icon: 'TrendingUp', badge: 'Más Vendido' },
        { title: 'Asesoría de Imagen y Outfits', description: 'Combinaciones recomendadas por estilistas para eventos, trabajo o uso diario.', icon: 'Heart', badge: 'Personalizado' }
      ],
      about: {
        title: 'Moda Auténtica Pensada para Ti',
        content: 'Nacimos con la pasión por ofrecer prendas que combinen diseño contemporáneo con comodidad duradera. Cada artículo de nuestro catálogo pasa por un estricto control de calidad para que vistas con confianza.',
        metrics: [
          { label: 'Clientes Satisfechos', value: '+18,500' },
          { label: 'Colecciones Lanzadas', value: '24' },
          { label: 'Calificación de Calidad', value: '4.9 ★' }
        ]
      },
      blog_posts: [
        { title: 'Cómo Combinar Calzado Casual con Prendas Elegantes sin Esfuerzo', excerpt: 'Guía práctica para armar looks versátiles de día y de noche con solo 3 piezas clave.', read_time: '3 min', date: 'Esta semana' },
        { title: 'Los Colores y Texturas que Dominarán las Calles esta Temporada', excerpt: 'Un vistazo a las tendencias globales de moda urbana y cómo adaptarlas a tu clóset.', read_time: '4 min', date: 'Hace unos días' }
      ],
      contact: {
        title: 'Visítanos o Haz tu Pedido en Línea',
        subtitle: 'Atención personalizada y asesoría por WhatsApp en todo momento.',
        phone: '+52 (656) 332-9900',
        email: 'ventas@novaconcept.mx',
        address: 'Plaza Galerías, Local 42, Zona Comercial'
      },
      social_posts: {
        facebook: { copy: '👗 ¡Estrena tus prendas favoritas hoy! Envíos rápidos y descuentos en tu primera compra.', cta: 'Ver Catálogo y Precios' },
        instagram: { copy: 'El outfit ideal para destacar en cualquier lugar. ✨👟 Cuéntanos cuál es tu estilo favorito.', hashtags: '#ModaUrbana #Sneakers #EstiloUnico #Tendencias2026 #OOTD' }
      },
      resumen_web: 'Catálogo de moda y calzado contemporáneo con envíos a todo México y atención personalizada.',
      copy_redes: '✨ Luce increíble con lo más nuevo en moda y calzado. ¡Compra en línea con entrega inmediata!',
      prompt_imagen: 'Fotografía publicitaria de moda editorial de alta costura urbana, modelos jóvenes en ropa vanguardista en estudio limpio con iluminación suave, 8k.'
    };
  }

  // 5. Florerías, Flores, Tulipanes, Rosas y Detalles
  if (lower.includes('flor') || lower.includes('tulipan') || lower.includes('rosa') || lower.includes('ramo') || lower.includes('arreglo floral')) {
    const sName = 'Bella Rosa Florería & Diseños Florales';
    return {
      titulo: `${sName}: Arreglos Florales Exclusivos y Entrega Inmediata`,
      site_name: sName,
      industry: 'Florería Boutique & Arreglos de Alta Gama',
      tagline: 'Flores frescas de corte diario que transmiten emociones y momentos inolvidables.',
      brand_colors: { primary: '#db2777', secondary: '#9d174d', accent: '#fce7f3' },
      hero: {
        badge: '🌸 Flores 100% Frescas • Entrega el Mismo Día',
        title: 'Arreglos Florales Únicos que Hablan por Ti',
        subtitle: `Ramos de rosas rojas, tulipanes holandeses, orquídeas y diseños florales para aniversarios, cumpleaños y ocasiones especiales con entrega rápida.`,
        primary_cta: 'Ver Catálogo de Ramos',
        secondary_cta: 'Pedir por WhatsApp',
        trust_badges: ['Flores Frescas Garantizadas', 'Entrega en 90 Minutos', 'Tarjeta Personalizada Gratis']
      },
      services: [
        { title: 'Ramos de Rosas & Tulipanes Premium', description: 'Selección de flores importadas con envoltura de lujo y listón satinado.', icon: 'Sparkles', badge: 'Más Vendido' },
        { title: 'Arreglos para Ocasiones Especiales', description: 'Diseños florales para aniversarios, bodas, graduaciones y eventos corporativos.', icon: 'Heart', badge: 'Exclusivo' },
        { title: 'Servicio a Domicilio Express', description: 'Entregamos tu sorpresa floral puntualmente con mensaje personalizado.', icon: 'TrendingUp', badge: 'Mismo Día' }
      ],
      about: {
        title: 'Pasión por el Arte Floral',
        content: `En ${sName} seleccionamos cada flor una por una desde los invernaderos más prestigiosos. Creemos que cada ramo cuenta una historia de amor, gratitud o celebración, y cuidamos cada detalle para que tu regalo sea perfecto.`,
        metrics: [{ label: 'Arreglos Entregados', value: '+8,500' }, { label: 'Sonrisas Generadas', value: '100%' }, { label: 'Años de Trayectoria', value: '7+' }]
      },
      blog_posts: [
        { title: 'Cómo Cuidar tus Rosas y Tulipanes para que Duren más de 12 Días', excerpt: 'Consejos prácticos para cortar tallos, cambiar agua y mantener tus flores resplandecientes.', read_time: '3 min', date: 'Esta semana' },
        { title: 'El Significado de los Colores en las Rosas', excerpt: 'Descubre qué mensaje transmite cada color antes de elegir tu ramo ideal.', read_time: '4 min', date: 'Hace unos días' }
      ],
      contact: {
        title: 'Haz tu Pedido o Personaliza tu Ramo',
        subtitle: 'Atención rápida por WhatsApp y entregas a domicilio.',
        phone: '+52 (656) 555-0199',
        email: 'pedidos@floreriarosa.com',
        address: 'Cobertura en toda la ciudad'
      },
      social_posts: {
        facebook: { copy: '🌹 ¡Sorprende a esa persona especial hoy mismo! Ramos de rosas y tulipanes frescos con entrega a domicilio.', cta: 'Ver Modelos y Precios' },
        instagram: { copy: 'El amor florece con los detalles correctos. ✨🌷 Haz tu pedido hoy con entrega express.', hashtags: '#Flores #Floreria #Rosas #Tulipanes #DetallesConAmor' }
      },
      resumen_web: 'Catálogo floral premium con venta de ramos de rosas, tulipanes y entrega express a domicilio.',
      copy_redes: '💐 Sorprende con el ramo perfecto. ¡Haz tu pedido hoy con entrega inmediata!',
      prompt_imagen: 'Fotografía comercial editorial de bouquet de rosas rojas y tulipanes rosados frescos en papel kraft elegante, iluminación suave y fondo limpio, 8k.'
    };
  }

  // 6. Donas, Panadería, Pastelería y Repostería
  if (lower.includes('dona') || lower.includes('pastel') || lower.includes('reposteria') || lower.includes('cupcake')) {
    const sName = 'Dulce Tentación - Donas & Pastelería';
    return {
      titulo: `${sName}: Donas Artesanales, Pasteles y Repostería Fina`,
      site_name: sName,
      industry: 'Repostería Artesanal, Donas Gourmet & Café',
      tagline: 'Masa fresca horneada a diario, rellenos irresistibles y café de altura.',
      brand_colors: { primary: '#ea580c', secondary: '#9a3412', accent: '#fed7aa' },
      hero: {
        badge: '🍩 Horneadas Frescas Cada Mañana',
        title: 'El Sabor Irresistible de las Donas Gourmet Hechas con Amor',
        subtitle: 'Donas artesanales glaseadas, rellenas de nutella, dulce de leche y frutos rojos, acompañadas del mejor café.',
        primary_cta: 'Ver Menú de Donas & Postres',
        secondary_cta: 'Hacer Pedido a Domicilio',
        trust_badges: ['100% Ingredientes Naturales', 'Horneadas al Momento', 'Cajas de Regalo Personalizadas']
      },
      services: [
        { title: 'Donas Clásicas y Glaseadas', description: 'Masa suave y esponjosa con glaseado tradicional de vainilla, chocolate y canela.', icon: 'Sparkles', badge: 'Favoritas' },
        { title: 'Especialidades Rellenas Gourmet', description: 'Rellenos generosos de crema pastelera, nutella, cajeta y compota de fresa natural.', icon: 'Heart', badge: 'Más Pedidas' },
        { title: 'Combos para Eventos & Fiestas', description: 'Cajas de 6, 12 o 24 donas decoradas para reuniones, cumpleaños y empresas.', icon: 'Users', badge: 'Paquetes' }
      ],
      about: {
        title: 'Nuestra Receta Secreta',
        content: `En ${sName} creemos que cada mordida debe ser un momento de pura felicidad. Usamos harina de trigo selecta, mantequilla pura y fermentación lenta para lograr la textura más suave del mercado.`,
        metrics: [{ label: 'Donas Horneadas al Mes', value: '+20,000' }, { label: 'Clientes Enamorados', value: '99.8%' }, { label: 'Recetas Originales', value: '18+' }]
      },
      blog_posts: [
        { title: 'El Secreto de una Masa Esponjosa: Fermentación y Temperatura', excerpt: 'Cómo logramos la consistencia perfecta sin conservadores artificiales.', read_time: '3 min', date: 'Esta semana' },
        { title: 'Los 5 Mejores Maridajes: Café Americano y Donas de Chocolate', excerpt: 'Por qué la combinación clásica de café tostado y chocolate sigue siendo insuperable.', read_time: '3 min', date: 'Hace unos días' }
      ],
      contact: {
        title: 'Haz tu Pedido o Visítanos en Sucursal',
        subtitle: 'Servicio a domicilio rápido para que disfrutes calientitas.',
        phone: '+52 (656) 555-0199',
        email: 'antojos@dulcetentacion.com',
        address: 'Servicio en mostrador y a domicilio'
      },
      social_posts: {
        facebook: { copy: '🍩 ¡Tu día merece un premio dulce! Pide hoy tu caja de donas artesanales recién salidas del horno.', cta: 'Pedir por WhatsApp' },
        instagram: { copy: 'Esponjosas, deliciosas y con mucho relleno. ✨ ¿Cuál es tu sabor favorito? Escríbenos para enviártelas.', hashtags: '#Donas #Donuts #Reposteria #Pasteleria #Foodie' }
      },
      resumen_web: 'Catálogo de donas artesanales, pasteles personalizados y postres con servicio a domicilio.',
      copy_redes: '🍩 Donas recién horneadas con el mejor sabor de la ciudad. ¡Pide tu caja hoy!',
      prompt_imagen: 'Fotografía publicitaria de donas artesanales glaseadas con chocolate y chispas sobre charola rústica con taza de café, iluminación cálida de panadería, 8k.'
    };
  }

  // 7. Taquerías, Tacos y Comida Mexicana
  if (lower.includes('taco') || lower.includes('taqueria') || lower.includes('pastor') || lower.includes('carnitas')) {
    const sName = 'Taquería El Auténtico Pastor';
    return {
      titulo: `${sName}: Los Mejores Tacos al Pastor, Asada y Especialidades`,
      site_name: sName,
      industry: 'Taquería Tradicional & Comida Mexicana',
      tagline: 'Sabor de tradición con carne marinada al pastor, tortillas recién hechas y salsas bravas.',
      brand_colors: { primary: '#dc2626', secondary: '#991b1b', accent: '#fef08a' },
      hero: {
        badge: '🌮 Tradición Taquera & Trompo al Pastor',
        title: 'El Auténtico Sabor del Pastor y la Asada Directo a tu Mesa',
        subtitle: 'Tacos al pastor con piña, bistec, costilla, gringas, volcanes y las mejores salsas. Servicio a domicilio rápido y en sucursal.',
        primary_cta: 'Ver Menú Taquero',
        secondary_cta: 'Pedir a Domicilio por WhatsApp',
        trust_badges: ['Carne 100% Calidad Sonora', 'Tortillas Hechas a Mano', 'Salsas Tradicionales Bravas']
      },
      services: [
        { title: 'Tacos al Pastor Tradicional', description: 'Carne de cerdo marinada con receta de la casa, asada al carbón con piña asada.', icon: 'Sparkles', badge: 'Estrella' },
        { title: 'Gringas, Volcanes y Costras', description: 'Queso fundido dorado con tu carne favorita en tortilla de harina o maíz.', icon: 'Heart', badge: 'Favorito' },
        { title: 'Tacos de Asada y Arrachera', description: 'Cortes jugosos asados a la parrilla con cebollitas cambray y chiles toreados.', icon: 'TrendingUp', badge: 'Cortes Pro' }
      ],
      about: {
        title: 'Más de 15 Años de Tradición',
        content: `En ${sName} respetamos la auténtica receta mexicana: marinado de 24 horas, cocción lenta al trompo y tortillas hechas al momento. Ven y comprueba por qué somos la taquería consentida de las familias mexicanas.`,
        metrics: [{ label: 'Tacos Servidos al Día', value: '+3,500' }, { label: 'Años de Sazón', value: '15 Años' }, { label: 'Clientes Frecuentes', value: '100%' }]
      },
      blog_posts: [
        { title: 'La Historia del Taco al Pastor y su Adaptación al Paladar Mexicano', excerpt: 'De la cocina de Medio Oriente a las calles de México: el origen de nuestro taco insignia.', read_time: '3 min', date: 'Esta semana' },
        { title: 'El Secreto de una Buena Salsa Taquera: Tiempos y Chiles', excerpt: 'Cómo balancear el picor del habanero y chile de árbol con tomate y especias.', read_time: '4 min', date: 'Hace unos días' }
      ],
      contact: {
        title: 'Pide tus Tacos o Visítanos en Sucursal',
        subtitle: 'Servicio a domicilio rápido con empaque térmico para que lleguen calientes.',
        phone: '+52 (656) 555-0199',
        email: 'taqueria@elautenticopastor.com',
        address: 'Abierto todos los días de 2:00 PM a 2:00 AM'
      },
      social_posts: {
        facebook: { copy: '🌮 ¿Antojo de unos buenos tacos al pastor con mucha piña y salsita brava? Pide ya a domicilio.', cta: 'Pedir por WhatsApp' },
        instagram: { copy: 'El sonido del trompo girando y el aroma que enamora. 🔥 ¡Te esperamos hoy con las órdenes bien servidas!', hashtags: '#Tacos #TacosAlPastor #Taqueria #ComidaMexicana #TacoTuesday' }
      },
      resumen_web: 'Menú taquero completo con pastor, asada, gringas y pedidos rápidos a domicilio.',
      copy_redes: '🌮 ¡Hoy se cena tacos de verdad! Pide a domicilio o visítanos en sucursal.',
      prompt_imagen: 'Fotografía gastronómica de orden de 5 tacos al pastor con cebolla, cilantro y piña en plato de barro, limón cortado y salsas, 8k.'
    };
  }

  // 8. Generador Dinámico Universal: Sintetiza marca y propuesta profesional sin concatenar instrucciones
  let dynamicBrand = 'Soluciones & Negocios Pro';
  const nameMatch = cleanBrief.match(/(?:llamada?|nombre|marca|titulada?)\s+([A-Za-z0-9Á-ÿ\s&]+?)(?:\s+en|\s+con|\s+de|,|\.|$)/i);
  if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2) {
    dynamicBrand = nameMatch[1].trim();
  } else {
    const rawWords = cleanBrief
      .replace(/^(hazme|crea|diseña|construye|elabora|genera|desarrolla|quiero|necesito|hacer|por favor hazme|por favor crea)\s+/i, '')
      .replace(/^(un|una|el|la)\s+(p[aá]gina|sitio|portal|landing|tienda|cat[aá]logo)\s+(web|de internet|online|virtual)?\s*/i, '')
      .replace(/^(para|de|sobre)\s+/i, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['quiero', 'hacer', 'pagina', 'sitio', 'tenga', 'donde', 'pueda'].includes(w.toLowerCase()));
    if (rawWords.length > 0) {
      const w1 = rawWords[0].charAt(0).toUpperCase() + rawWords[0].slice(1);
      const w2 = rawWords.length > 1 ? rawWords[1].charAt(0).toUpperCase() + rawWords[1].slice(1) : 'Studio';
      dynamicBrand = `${w1} & ${w2}`;
    }
  }

  let dynPrimary = '#1d7eae';
  let dynSecondary = '#0032a0';
  let dynAccent = '#98dae9';

  if (lower.includes('rosa') || lower.includes('pastel')) {
    dynPrimary = '#db2777'; dynSecondary = '#9d174d'; dynAccent = '#fbcfe8';
  } else if (lower.includes('dorad') || lower.includes('oro')) {
    dynPrimary = '#d97706'; dynSecondary = '#78350f'; dynAccent = '#fde68a';
  } else if (lower.includes('verde') || lower.includes('eco')) {
    dynPrimary = '#059669'; dynSecondary = '#047857'; dynAccent = '#a7f3d0';
  } else if (lower.includes('naranja') || lower.includes('fuego')) {
    dynPrimary = '#ea580c'; dynSecondary = '#9a3412'; dynAccent = '#fed7aa';
  } else if (lower.includes('rojo')) {
    dynPrimary = '#dc2626'; dynSecondary = '#991b1b'; dynAccent = '#fca5a5';
  } else if (lower.includes('morad') || lower.includes('purpura')) {
    dynPrimary = '#7c3aed'; dynSecondary = '#5b21b6'; dynAccent = '#ddd6fe';
  }

  return {
    titulo: `${dynamicBrand}: Soluciones Profesionales de Alta Calidad`,
    site_name: dynamicBrand,
    industry: 'Servicios Profesionales & Soluciones a Medida',
    tagline: 'Calidad superior, atención personalizada y resultados comprobados.',
    brand_colors: { primary: dynPrimary, secondary: dynSecondary, accent: dynAccent },
    hero: {
      badge: '✨ Calidad Garantizada & Atención Inmediata',
      title: 'Soluciones Profesionales Diseñadas para Superar tus Expectativas',
      subtitle: 'Atención personalizada, presupuestos transparentes y la mejor experiencia de servicio diseñada a tu medida.',
      primary_cta: 'Solicitar Cotización / Información',
      secondary_cta: 'Contactar por WhatsApp',
      trust_badges: ['Atención 100% Personalizada', 'Precios Claros y Transparentes', 'Garantía de Satisfacción']
    },
    services: [
      {
        title: 'Asesoría y Atención Personalizada',
        description: 'Te orientamos paso a paso para ofrecerte exactamente la solución que se adapta a tus necesidades.',
        icon: 'Sparkles',
        badge: 'Destacado'
      },
      {
        title: 'Servicios de Calidad Garantizada',
        description: 'Procesos optimizados y atención de primer nivel con los más altos estándares de satisfacción.',
        icon: 'ShieldCheck',
        badge: 'Recomendado'
      },
      {
        title: 'Atención Rápida y Soporte Continuo',
        description: 'Compromiso firme en cada etapa para que tu experiencia sea ágil, confiable y segura.',
        icon: 'TrendingUp',
        badge: 'Garantizado'
      }
    ],
    about: {
      title: 'Compromiso y Pasión por lo que Hacemos',
      content: `En ${dynamicBrand} nos dedicamos a entregar un servicio impecable y transparente. Cada cliente es único y trabajamos con la mayor dedicación para superar tus expectativas en cada detalle.`,
      metrics: [
        { label: 'Clientes Atendidos', value: '+1,500' },
        { label: 'Satisfacción Comprobada', value: '99.5%' },
        { label: 'Años de Experiencia', value: '8 Años' }
      ]
    },
    blog_posts: [
      {
        title: 'Recomendaciones Clave para Elegir la Mejor Opción',
        excerpt: 'Aspectos fundamentales que debes evaluar para garantizar una experiencia satisfactoria y segura.',
        read_time: '3 min',
        date: 'Esta semana'
      },
      {
        title: 'Tendencias y Buenas Prácticas para Mejores Resultados',
        excerpt: 'Cómo la innovación constante nos permite ofrecer un servicio más rápido y eficiente.',
        read_time: '4 min',
        date: 'Hace unos días'
      }
    ],
    contact: {
      title: 'Ponte en Contacto con Nuestro Equipo',
      subtitle: 'Cotizaciones sin compromiso y respuesta rápida por WhatsApp.',
      phone: '+52 (656) 555-0100',
      email: `contacto@${dynamicBrand.toLowerCase().replace(/[^a-z0-9]/g, '') || 'negocio'}.com`,
      address: 'Cobertura Integral'
    },
    social_posts: {
      facebook: {
        copy: `¿Buscando la mejor opción con calidad y atención personalizada? En ${dynamicBrand} estamos listos para atenderte hoy.`,
        cta: 'Contactar por WhatsApp'
      },
      instagram: {
        copy: 'Calidad, compromiso y resultados que marcan la diferencia. ✨ Escríbenos para más información.',
        hashtags: '#Calidad #ServiciosProfesionales #AtencionAlCliente #Resultados #PyME'
      }
    },
    resumen_web: `Sitio web y catálogo integral para ${dynamicBrand}, desarrollado para captar clientes calificados y brindar información clara.`,
    copy_redes: `🚀 ¡Descubre las mejores soluciones con ${dynamicBrand}! Calidad y atención personalizada.`,
    prompt_imagen: `Fotografía publicitaria profesional, estética moderna y limpia, iluminación de estudio, alta resolución 8k.`
  };
}

// GET /api/content/ or /api/content
app.get(['/api/content', '/api/content/'], (_req, res) => {
  const approved = contents.filter(c => c.status === 'APPROVED' || c.status === 'PUBLISHED');
  res.json(approved);
});

// GET /api/all-content/ (includes pending proposals for the management dashboard)
app.get(['/api/all-content', '/api/all-content/'], (_req, res) => {
  res.json(contents);
});

// POST /api/generate or /api/generate/
app.post(['/api/generate', '/api/generate/'], async (req, res) => {
  const brief = req.body?.brief;
  const _userEmail = req.body?.userEmail || 'admin@myos.com';
  const previousSite = req.body?.previousSite || null;
  const isRefinement = Boolean(previousSite || req.body?.isRefinement);
  const refineInstruction = req.body?.refineInstruction || (isRefinement ? brief : null);

  if (!brief || typeof brief !== 'string' || !brief.trim()) {
    return res.status(400).json({ error: 'El brief o instrucción es obligatorio.' });
  }

  let parsedContent: any = null;

  try {
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    let systemPrompt = '';
    const generationRules = `
REGLAS DE INTERPRETACIÓN OBLIGATORIAS:
- Trata la petición del usuario como requisitos del proyecto, no como texto para copiar literalmente en la web.
- Antes de redactar, identifica mentalmente: objetivo del sitio, tipo de negocio/proyecto, audiencia, acción principal, estilo visual, colores explícitos, páginas/secciones solicitadas, funcionalidades y contenido que el usuario aportó.
- Respeta primero las instrucciones explícitas del usuario. No reemplaces colores, tono, estructura, idioma, funcionalidades ni contenido solicitados por preferencias predeterminadas.
- Si el usuario pide una tienda, catálogo, portafolio, restaurante, reservas, evento, landing page, sitio informativo u otro tipo concreto, adapta el contenido y la jerarquía a ese objetivo; no asumas que todos son sitios corporativos.
- Si el usuario especifica secciones, conserva esas secciones y su prioridad. Si no especifica estructura, elige una estructura apropiada para el objetivo y no agregues secciones irrelevantes.
- Para cambios sobre un sitio existente, modifica solo lo solicitado y conserva todos los demás datos y decisiones existentes. No reconstruyas la identidad ni elimines secciones salvo que el usuario lo pida o sea indispensable.
- No inventes testimonios, certificaciones, clientes, métricas, premios, direcciones, teléfonos, correos ni garantías como si fueran reales. Si falta información real, usa texto neutral o deja un valor vacío/claramente editable.
- Usa español salvo que el usuario solicite otro idioma.
- Escribe textos específicos del negocio y evita frases genéricas repetidas.
- Devuelve JSON válido, sin Markdown, comentarios ni texto fuera del objeto.
`;
    if (isRefinement && previousSite) {
      systemPrompt = `Eres un Diseñador Web y Copywriter Senior con Inteligencia Artificial de MYOS.
${generationRules}
El cliente ya tiene este sitio web generado:
${JSON.stringify({
  site_name: previousSite.site_name,
  industry: previousSite.industry,
  tagline: previousSite.tagline,
  brand_colors: previousSite.brand_colors,
  hero: previousSite.hero,
  services: previousSite.services,
  about: previousSite.about,
  blog_posts: previousSite.blog_posts,
  contact: previousSite.contact
}, null, 2)}

Ahora el cliente solicita esta NUEVA INSTRUCCIÓN DE AJUSTE O CAMBIO:
"${refineInstruction || brief.trim()}"

TU MISIÓN:
Aplica lo que el usuario pide estrictamente:
- Si pide cambiar colores, actualiza "brand_colors".
- Si pide cambiar el nombre, ofertas, promociones, textos o llamados a la acción, modifícalos con redacción persuasiva.
- Si pide agregar productos, secciones o servicios, incorpóralos manteniendo la coherencia.
- PROHIBIDO poner la instrucción del usuario textualmente en los títulos (nunca titules "Cámbialo a color...").
- Devuelve la estructura actualizada completa del sitio web en formato JSON.

Responde ÚNICAMENTE un JSON válido con estas llaves:
"titulo", "site_name", "industry", "tagline", "brand_colors" ({"primary", "secondary", "accent"}), "hero" ({"badge", "title", "subtitle", "primary_cta", "secondary_cta", "trust_badges"}), "services" ([{"title", "description", "icon", "badge"}]), "about" ({"title", "content", "metrics"}), "blog_posts", "contact" ({"title", "subtitle", "phone", "email", "address"}), "social_posts", "resumen_web", "copy_redes", "prompt_imagen".`;
    } else {
      systemPrompt = `Eres un Diseñador Web y Copywriter Senior con Inteligencia Artificial de MYOS.
${generationRules}
El usuario quiere que le construyas una página web adaptada a sus necesidades a partir de esta instrucción en lenguaje natural:
"${brief.trim()}"

REGLAS CRÍTICAS DE DISEÑO:
1. PROHIBIDO COPIAR O PEGAR LA INSTRUCCIÓN DEL USUARIO LITERALMENTE en los encabezados, títulos o tarjetas (por ejemplo, NUNCA titules "Líderes en hazme una pagina de...", o "Servicios de quiero una tienda...").
2. Interpreta lo que el cliente quiere como un profesional:
   - Si dio un nombre de negocio, úsalo; si no, inventa un nombre comercial atractivo y memorable acorde al giro.
   - Si pidió colores o estilo específicos en su instrucción, aplícalos en "brand_colors" y en el tono.
   - Incluye servicios o productos solo cuando encajen con el tipo de sitio solicitado; si se pidió una tienda, prioriza productos, categorías, precios editables y acciones de compra.
   - Escribe un titular principal y una propuesta de valor adecuados al objetivo de conversión del sitio.
   - No fuerces una sección "Nosotros", blog ni métricas si no tienen sentido para la petición. Cuando el esquema exija esos campos, rellénalos de forma breve, neutral y sin inventar hechos.
   - No inventes datos de contacto: si no se proporcionaron, usa campos vacíos o marcadores claramente editables.

Responde ÚNICAMENTE un JSON válido con estas llaves exactas:
- "titulo": Título comercial atractivo
- "site_name": Nombre auténtico del negocio o marca
- "industry": Giro o nicho comercial
- "tagline": Eslogan o propuesta de valor
- "brand_colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex" }
- "hero": {
    "badge": "Etiqueta destacada con emoji (ej: 🌟 Hecho con Tradición)",
    "title": "Titular principal de alta conversión",
    "subtitle": "Subtítulo explicando la solución y beneficios concretos",
    "primary_cta": "Botón de acción principal",
    "secondary_cta": "Botón secundario",
    "trust_badges": ["Sello 1", "Sello 2", "Sello 3"]
  }
- "services": [
    { "title": "Servicio o Producto 1", "description": "Descripción orientada a resultados", "icon": "Sparkles", "badge": "Destacado" },
    { "title": "Servicio o Producto 2", "description": "Descripción orientada a resultados", "icon": "ShieldCheck", "badge": "Popular" },
    { "title": "Servicio o Producto 3", "description": "Descripción orientada a resultados", "icon": "TrendingUp", "badge": "Garantizado" }
  ]
- "about": {
    "title": "Nuestra Historia / Propuesta de Valor",
    "content": "Historia y misión del negocio",
    "metrics": [
      { "label": "Beneficio", "value": "Calidad" },
      { "label": "Atención", "value": "Cercana" },
      { "label": "Enfoque", "value": "Personalizado" }
    ]
  }
- "blog_posts": [
    { "title": "Artículo 1", "excerpt": "Consejos o valor", "read_time": "3 min", "date": "Esta semana" },
    { "title": "Artículo 2", "excerpt": "Consejos o valor", "read_time": "4 min", "date": "Hace unos días" }
  ]
- "contact": {
    "title": "Contacto y Pedidos",
    "subtitle": "Texto breve para invitar al contacto",
    "phone": "",
    "whatsapp": "",
    "email": "",
    "address": "",
    "hours": "",
    "location_url": ""
  }
- DATOS PERSONALES Y DEL NEGOCIO: si el usuario proporciona teléfono, WhatsApp, correo, dirección, ubicación, horarios o redes sociales, conserva esos valores exactamente y colócalos en los campos correspondientes. Nunca inventes datos de contacto. Si el usuario solicita esos datos pero no los proporciona, deja el campo vacío y señala fuera del contenido generado que necesita completarlo; si el usuario pide expresamente marcadores editables, usa textos como [Agregar teléfono] claramente identificados como pendientes.
- "social_posts": {
    "facebook": { "copy": "Copy publicitario para Facebook", "cta": "Ver Más" },
    "instagram": { "copy": "Copy visual para Instagram", "hashtags": "#Negocio #Calidad" }
  }
- "resumen_web": "Resumen ejecutivo del sitio web",
- "copy_redes": "Publicación publicitaria para redes sociales",
- "prompt_imagen": "Prompt fotográfico en inglés para imagen publicitaria en 8K"`;
    }

    // Probar candidatos con reintento ante picos transitorios de demanda (503)
    let generatedSuccessfully = false;
    for (let attempt = 0; attempt < 2 && !generatedSuccessfully; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: systemPrompt,
            config: {
              responseMimeType: 'application/json'
            }
          });
          const text = response.text || '';
          const cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
          parsedContent = JSON.parse(cleaned);
          if (parsedContent?.titulo && parsedContent?.site_name) {
            generatedSuccessfully = true;
            break;
          }
        } catch {
          // Si el modelo está ocupado o falla temporalmente, probar el siguiente
        }
      }
    }
  } catch {
    // Si falla la inicialización de la API, se activa automáticamente el sintetizador inteligente
  }

  // Fallback inteligente contextual si la API de Gemini no está disponible
  if (!parsedContent || !parsedContent.titulo || !parsedContent.site_name) {
    const smart = generateSmartContent(brief, { previousSite });
    parsedContent = { ...smart, ...(parsedContent || {}) };
  }

  // Aplicar personalización de logo, fotos, colores y diseño solicitados por el usuario
  if (req.body?.customLogo) {
    parsedContent.custom_logo = req.body.customLogo;
  }
  if (req.body?.heroImage) {
    parsedContent.hero_image = req.body.heroImage;
  }
  if (req.body?.customPhotos) {
    parsedContent.custom_photos = req.body.customPhotos;
  }
  if (req.body?.customColors?.primary) {
    parsedContent.brand_colors = {
      primary: req.body.customColors.primary,
      secondary: req.body.customColors.secondary || '#0032a0',
      accent: req.body.customColors.accent || '#98dae9'
    };
  }
  if (req.body?.designTheme) {
    parsedContent.design_theme = req.body.designTheme;
  }

  // Generar código HTML5 completo y asignarle archivos para Google Drive CMS
  parsedContent.full_html = generateStandaloneHtml(parsedContent);
  const safeSlug = (parsedContent.site_name || 'sitio').toLowerCase().replace(/[^a-z0-9]/g, '_');
  parsedContent.drive_files = {
    pages_file: `/Sitio_Web/Paginas/${safeSlug}_index.html`,
    blog_file: `/Sitio_Web/Blog/articulos_${safeSlug}.md`,
    social_file: `/Redes_Sociales/Para_Publicar/campaña_${safeSlug}.json`,
    brand_file: `/Marca/logo_oficial.png`
  };

  // REGLA NO NEGOCIABLE: Todo contenido generado se guarda con estado PENDING
  const newId = nextId++;
  const newRecord: ContentItem = {
    id: newId,
    title: parsedContent.titulo,
    slug: `propuesta-${newId}`,
    category: 'PÁGINA WEB / REDES',
    status: 'PENDING', // APROBACIÓN HUMANA OBLIGATORIA
    brief: brief.trim(),
    body_text: parsedContent.resumen_web,
    created_at: new Date().toISOString(),
    drive_file_id: `drive_draft_${newId}`,
    content: parsedContent
  };

  contents.unshift(newRecord);

  return res.status(201).json({
    id: newId,
    status: 'PENDING',
    content: parsedContent,
    record: newRecord
  });
});


// GET /api/drive/files — lectura de archivos directamente dentro de la carpeta compartida.
// Solo metadatos: no descarga ni modifica archivos de Drive.
app.get(['/api/drive/files', '/api/drive/files/'], async (req, res) => {
  const configuredToken = process.env.MYOS_DRIVE_API_TOKEN;
  const authHeader = req.header('authorization') || '';
  const suppliedToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!configuredToken) {
    return res.status(503).json({ error: 'La integración de Google Drive no está configurada en el servidor.' });
  }

  const expected = Buffer.from(configuredToken);
  const supplied = Buffer.from(suppliedToken);
  const tokenMatches = expected.length > 0 &&
    expected.length === supplied.length &&
    timingSafeEqual(expected, supplied);

  if (!tokenMatches) {
    return res.status(401).json({ error: 'No autorizado.' });
  }

  const folderId = process.env.MYOS_DRIVE_FOLDER_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!folderId || !serviceAccountJson) {
    return res.status(503).json({ error: 'Faltan variables de configuración de Google Drive.' });
  }

  try {
    const credentials = JSON.parse(serviceAccountJson);
    if (!credentials.client_email || !credentials.private_key) {
      return res.status(503).json({ error: 'La credencial de Google Drive no tiene el formato esperado.' });
    }

    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
    const drive = google.drive({ version: 'v3', auth });
    const result = await drive.files.list({
      q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`,
      pageSize: 100,
      orderBy: 'name',
      fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    return res.json({
      folderId,
      files: (result.data.files || []).map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink
      })),
      nextPageToken: result.data.nextPageToken || null
    });
  } catch (error) {
    // No registrar credenciales ni detalles internos de Google en la respuesta.
    console.error('Google Drive metadata listing failed.');
    return res.status(502).json({ error: 'No se pudieron consultar los archivos de Google Drive. Verifica que la cuenta de servicio tenga acceso a la carpeta.' });
  }
});

// POST /api/approve/:id — requires explicit human identity and a pending record.
// TODO(production): verify the Firebase ID token server-side before trusting identity fields.
app.post(['/api/approve/:id', '/api/approve/:id/'], (req, res) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const approverEmail = typeof req.body?.approverEmail === 'string' ? req.body.approverEmail.trim() : '';
  const approverName = typeof req.body?.approverName === 'string' ? req.body.approverName.trim() : '';

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identificador de contenido inválido.' });
  }
  if (!approverEmail || !approverName) {
    return res.status(401).json({ error: 'Debes iniciar sesión para registrar una aprobación humana.' });
  }

  const item = contents.find(c => c.id === id);
  if (!item) {
    return res.status(404).json({ error: 'La propuesta no existe en el servidor. No se puede aprobar una propuesta no registrada.' });
  }
  if (item.status !== 'PENDING') {
    return res.status(409).json({ error: 'Solo se puede aprobar contenido en estado PENDING.', status: item.status });
  }

  // Registrar quién aprobó y cuándo. La aprobación no publica por sí misma en redes sociales.
  const approvedAt = new Date().toISOString();
  item.status = 'APPROVED';
  item.approved_at = approvedAt;
  item.approved_by = approverName;
  item.approved_by_email = approverEmail;

  if (req.body?.proposalData) {
    item.content = req.body.proposalData;
    item.title = req.body.proposalData.site_name || req.body.proposalData.titulo || item.title;
    item.body_text = req.body.proposalData.resumen_web || item.body_text;
  } else if (item.content?.resumen_web) {
    item.body_text = item.content.resumen_web;
    item.title = item.content.titulo || item.title;
  }

  return res.json({
    message: 'Aprobación humana registrada. La publicación sigue siendo una acción separada.',
    status: 'APPROVED',
    item
  });
});

// GET /preview/:id o /site/:id para abrir la página en otra pestaña como HTML autónomo
app.get(['/preview/:id', '/site/:id', '/api/site/:id/preview'], (req, res) => {
  const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const numId = parseInt(paramId, 10);
  const item = contents.find(c => c.id === numId || String(c.id) === String(paramId));
  if (!item || !item.content) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><title>Sitio no encontrado</title><script src="https://cdn.tailwindcss.com"></script></head>
      <body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6 text-center font-sans">
        <div class="max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
          <h1 class="text-2xl font-black text-amber-400">Página Web No Encontrada</h1>
          <p class="text-slate-400 text-sm">El sitio solicitado (#${paramId}) aún no ha sido generado o aprobado.</p>
          <a href="/" class="inline-block px-5 py-2.5 rounded-xl bg-[#1d7eae] text-white font-bold text-xs">Volver al Generador</a>
        </div>
      </body>
      </html>
    `);
  }

  const html = generateStandaloneHtml(item.content);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

// POST /api/site/render-html para renderizar dinámicamente HTML a partir de un objeto JSON
app.post(['/api/site/render-html', '/api/site/render-html/'], (req, res) => {
  const siteData = req.body?.content || req.body;
  if (!siteData) {
    return res.status(400).json({ error: 'No se envió contenido del sitio.' });
  }
  const html = generateStandaloneHtml(siteData);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

// PUT /api/content/:id para guardar modificaciones de textos o fotos
app.put(['/api/content/:id', '/api/content/:id/'], (req, res) => {
  const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(paramId, 10);
  let item = contents.find(c => c.id === id || String(c.id) === String(paramId));
  
  if (!item) {
    if (req.body?.content) {
      const newItem: ContentItem = {
        id: isNaN(id) ? nextId++ : id,
        title: req.body.content.site_name || req.body.content.titulo || `Sitio #${paramId}`,
        slug: `sitio-${paramId}`,
        category: 'PÁGINA WEB / REDES',
        status: 'APPROVED',
        body_text: req.body.content.resumen_web || '',
        created_at: new Date().toISOString(),
        content: req.body.content
      };
      contents.unshift(newItem);
      return res.json({ message: 'Contenido creado y sincronizado.', item: newItem });
    }
    return res.status(404).json({ error: 'Contenido no encontrado.' });
  }

  if (req.body?.content) {
    item.content = { ...item.content, ...req.body.content };
    if (req.body.content.site_name || req.body.content.titulo) {
      item.title = req.body.content.site_name || req.body.content.titulo;
    }
    if (req.body.content.resumen_web) {
      item.body_text = req.body.content.resumen_web;
    }
  }

  return res.json({ message: 'Contenido actualizado.', item });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MYOS Platform server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
