import React, { useState, useRef } from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Share2,
  FolderTree,
  Code2,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  Coffee,
  Heart,
  Users,
  TrendingUp,
  Cpu,
  BarChart3,
  Network,
  ThumbsUp,
  MessageCircle,
  Copy,
  Check,
  Calendar,
  FileText,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Download,
  Maximize2,
  Minimize2,
  ExternalLink,
  Upload,
  Image,
  Palette,
  Wand2,
  Trash2,
  Edit3,
  Camera
} from 'lucide-react';
import EditContentModal from './EditContentModal';

function buildHtmlFallback(site) {
  const primary = site?.brand_colors?.primary || '#E95349';
  const secondary = site?.brand_colors?.secondary || '#C6443F';
  const siteName = site?.site_name || site?.titulo || 'Mi Negocio';
  const tagline = site?.tagline || 'Solución de Alta Conversión';
  const customLogo = site?.custom_logo || null;

  const servicesHtml = (site?.services || []).map((s, idx) => `
    <div class="p-6 rounded-2xl bg-white border border-[#DFE3EC] hover:border-[#C8CEDB] transition shadow-lg">
      ${s.image ? `<div class="mb-3 rounded-xl overflow-hidden h-36 border border-[#DFE3EC]"><img src="${s.image}" alt="${s.title}" class="w-full h-full object-cover" /></div>` : ''}
      <div class="flex justify-between items-start mb-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg" style="background-color: ${primary}20; color: ${primary};">
          ${idx + 1}
        </div>
        ${s.badge ? `<span class="text-xs px-2.5 py-1 rounded-full font-bold bg-[#F2F4FA] text-[#3A4256] border border-[#C8CEDB]">${s.badge}</span>` : ''}
      </div>
      <h3 class="text-lg font-bold text-[#252B3A] mb-2">${s.title}</h3>
      <p class="text-sm text-[#5A6172] leading-relaxed">${s.description}</p>
    </div>
  `).join('');

  const metricsHtml = (site?.about?.metrics || []).map(m => `
    <div class="p-4 rounded-xl bg-white border border-[#DFE3EC] text-center">
      <div class="text-2xl font-black mb-1" style="color: ${primary};">${m.value}</div>
      <div class="text-xs text-[#5A6172] font-medium">${m.label}</div>
    </div>
  `).join('');

  const logoHtml = customLogo
    ? `<img src="${customLogo}" alt="${siteName}" class="h-9 max-w-[150px] object-contain rounded bg-white/5 p-1 border border-[#DFE3EC]" />`
    : `<div class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[#252B3A] text-base shadow-md" style="background: linear-gradient(135deg, ${primary}, ${secondary});">
        ${siteName.charAt(0)}
      </div>`;

  return `<!DOCTYPE html>
<html lang="es" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName} — ${tagline}</title>
  <meta name="description" content="${site?.resumen_web || tagline}">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { color-scheme: light; }
    html, body { font-family: 'Plus Jakarta Sans', sans-serif !important; background: #FFFFFF !important; color: #1E1E1E !important; }
    body, header, main, section, article, footer, nav, form,
    [class*="bg-slate-"], [class*="bg-gray-900"], [class*="bg-black"],
    [class*="bg-[#0"], [class*="bg-[#1"], [class*="bg-[#2"] {
      background-color: #FFFFFF !important; background-image: none !important;
    }
    .text-white, [class*="text-slate-"], [class*="text-gray-"] { color: #1E1E1E !important; }
    [style*="linear-gradient"] { background: linear-gradient(135deg, #E95349 0%, #C6443F 100%) !important; color: #FFFFFF !important; }
    [style*="linear-gradient"] * { color: #FFFFFF !important; }
    [class*="bg-[#E2554F]"], [class*="bg-[#E95349]"], [class*="bg-[#C6443F]"], [class*="bg-red-"] {
      background-color: #E95349 !important; background-image: linear-gradient(135deg, #E95349 0%, #C6443F 100%) !important; color: #FFFFFF !important;
    }
    [class*="bg-[#E2554F]"] *, [class*="bg-[#E95349]"] *, [class*="bg-[#C6443F]"] *, [class*="bg-red-"] * { color: #FFFFFF !important; }

    [class*="border-slate-"], [class*="border-gray-"] { border-color: #F1F1F1 !important; }
    input, textarea, select { background: #FFFFFF !important; color: #1E1E1E !important; border-color: #E4E4E4 !important; }
    input::placeholder, textarea::placeholder { color: #757575 !important; opacity: 1; }
  </style>
</head>
<body class="bg-white text-[#252B3A] antialiased selection:bg-[#E2554F] selection:text-[#252B3A]">
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#DFE3EC]/80">
    <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
      <a href="#inicio" class="flex items-center gap-2.5">
        ${logoHtml}
        <div>
          <span class="font-extrabold text-base tracking-tight text-[#252B3A] block leading-tight">${siteName}</span>
          <span class="text-[10px] text-[#5A6172] block leading-none">${site?.industry || 'PyME'}</span>
        </div>
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm font-semibold text-[#3A4256]">
        <a href="#inicio" class="hover:text-[#252B3A] transition">Inicio</a>
        <a href="#servicios" class="hover:text-[#252B3A] transition">Servicios</a>
        <a href="#nosotros" class="hover:text-[#252B3A] transition">Nosotros</a>
        <a href="#contacto" class="hover:text-[#252B3A] transition">Contacto</a>
      </nav>
      <a href="#contacto" class="px-5 py-2.5 rounded-xl font-bold text-xs text-[#252B3A] shadow-lg transition hover:opacity-95" style="background: linear-gradient(135deg, ${primary}, ${secondary});">
        ${site?.hero?.primary_cta || 'Contactar'}
      </a>
    </div>
  </header>
  <section id="inicio" class="relative pt-20 pb-24 px-6 overflow-hidden text-center max-w-4xl mx-auto space-y-6">
    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white border border-[#DFE3EC] text-[#252B3A]">
      <span>✨</span> <span>${site?.hero?.badge || 'Solución Profesional'}</span>
    </div>
    <h1 class="text-4xl sm:text-6xl font-black text-[#252B3A] leading-tight tracking-tight">${site?.hero?.title || site?.titulo}</h1>
    <p class="text-base sm:text-lg text-[#3A4256] max-w-2xl mx-auto leading-relaxed">${site?.hero?.subtitle || site?.resumen_web}</p>
    <div class="flex justify-center gap-4 pt-4">
      <a href="#contacto" class="px-8 py-4 rounded-xl font-bold text-[#252B3A] shadow-xl transition" style="background: linear-gradient(135deg, ${primary}, ${secondary});">
        ${site?.hero?.primary_cta || 'Comenzar Ahora'}
      </a>
    </div>
    ${site?.hero_image ? `
    <div class="mt-8 rounded-2xl overflow-hidden border border-[#DFE3EC] shadow-2xl max-w-3xl mx-auto">
      <img src="${site.hero_image}" alt="${siteName}" class="w-full max-h-[420px] object-cover" />
    </div>` : ''}
  </section>
  <section id="servicios" class="py-20 px-6 bg-[#F2F4FA] border-y border-[#DFE3EC] max-w-6xl mx-auto space-y-12">
    <div class="text-center space-y-2 max-w-xl mx-auto">
      <h2 class="text-3xl font-extrabold text-[#252B3A]">Nuestros Servicios</h2>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">${servicesHtml}</div>
  </section>
  <section id="nosotros" class="py-20 px-6 max-w-4xl mx-auto space-y-10">
    <h2 class="text-3xl font-extrabold text-[#252B3A] text-center">${site?.about?.title || 'Nosotros'}</h2>
    ${site?.about?.image ? `
    <div class="rounded-xl overflow-hidden border border-[#DFE3EC] mb-4 max-w-md mx-auto">
      <img src="${site.about.image}" alt="Nosotros" class="w-full max-h-56 object-cover" />
    </div>` : ''}
    <div class="p-6 rounded-2xl bg-white border border-[#DFE3EC] text-[#3A4256] leading-relaxed text-left whitespace-pre-line">${site?.about?.content || site?.resumen_web}</div>
    <div class="grid grid-cols-3 gap-4">${metricsHtml}</div>
  </section>
  <section id="contacto" class="py-20 px-6 max-w-3xl mx-auto rounded-3xl bg-white border border-[#DFE3EC] p-8 space-y-6">
    <h2 class="text-3xl font-extrabold text-[#252B3A] text-center">${site?.contact?.title || 'Contacto'}</h2>
    <p class="text-sm text-[#5A6172] text-center">${site?.contact?.subtitle || 'Estamos a tu servicio'}</p>
    <div class="pt-4 border-t border-[#DFE3EC] grid sm:grid-cols-3 gap-4 text-xs text-[#5A6172] text-center">
      <div>📍 ${site?.contact?.address || 'Ciudad Juárez'}</div>
      <div>📞 ${site?.contact?.phone || '+52 (656) 000-0000'}</div>
      <div>✉️ ${site?.contact?.email || 'contacto@empresa.com'}</div>
    </div>
  </section>
  <footer class="py-8 text-center text-xs text-[#5A6172] border-t border-[#DFE3EC]">
    © 2026 ${siteName}. Todos los derechos reservados.
  </footer>
</body>
</html>`;
}

// Generador de Componente React (Next.js / SSR / SSG) para Vercel
function generateReactCode(site) {
  const siteName = site?.site_name || 'MiNegocio';
  const compName = siteName.replace(/[^a-zA-Z0-9]/g, '') || 'Website';
  const primary = site?.brand_colors?.primary || '#1d7eae';

  return `import React, { useState } from 'react';
import Head from 'next/head';

// ==============================================================================
// Componente React (Next.js / SSR / SSG) optimizado para despliegue en Vercel
// Fuente central de datos: Google Drive CMS (/Sitio_Web/Paginas)
// ==============================================================================
export default function ${compName}Page() {
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm)
      });
      if (res.ok) setSubmitted(true);
    } catch (err) {
      console.error('Error enviando lead:', err);
    }
  };

  return (
    <>
      <Head>
        <title>${site.site_name || site.titulo} — ${site.tagline || 'Solución de Alta Conversión'}</title>
        <meta name="description" content="${site.resumen_web || ''}" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white text-[#252B3A] font-sans selection:bg-[${primary}] selection:text-[#252B3A]">
        
        {/* Header con Navegación Dinámica */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#DFE3EC]">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[#252B3A] bg-[${primary}]">
                ${siteName.charAt(0)}
              </div>
              <span className="font-extrabold text-lg text-[#252B3A]">${site.site_name}</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-[#3A4256]">
              <a href="#inicio" className="hover:text-[#252B3A] transition">Inicio</a>
              <a href="#servicios" className="hover:text-[#252B3A] transition">Servicios</a>
              <a href="#nosotros" className="hover:text-[#252B3A] transition">Nosotros</a>
              <a href="#contacto" className="hover:text-[#252B3A] transition">Contacto</a>
            </nav>
            <a href="#contacto" className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#252B3A] bg-[${primary}] hover:opacity-90 transition">
              ${site.hero?.primary_cta || 'Contactar'}
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <section id="inicio" className="relative pt-20 pb-24 px-6 text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white border border-[#DFE3EC] text-[#D14842]">
            <span>✨</span> <span>${site.hero?.badge || 'Solución Profesional'}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-[#252B3A] leading-tight">
            ${site.hero?.title || site.titulo}
          </h1>
          <p className="text-base sm:text-lg text-[#3A4256] max-w-2xl mx-auto leading-relaxed">
            ${site.hero?.subtitle || site.resumen_web}
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <a href="#contacto" className="px-8 py-3.5 rounded-xl font-bold text-[#252B3A] bg-[${primary}] shadow-xl transition">
              ${site.hero?.primary_cta || 'Comenzar Ahora'}
            </a>
          </div>
        </section>

        {/* Servicios Sincronizados desde Google Drive */}
        <section id="servicios" className="py-20 px-6 bg-[#F2F4FA] border-y border-[#DFE3EC] max-w-6xl mx-auto space-y-12">
          <h2 className="text-3xl font-extrabold text-[#252B3A] text-center">Nuestros Servicios</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {${JSON.stringify(site.services || [], null, 2)}.map((s, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-[#DFE3EC] space-y-3">
                <span className="text-xs font-bold px-2 py-1 rounded bg-[#F2F4FA] text-[#D14842]">{s.badge}</span>
                <h3 className="text-lg font-bold text-[#252B3A]">{s.title}</h3>
                <p className="text-sm text-[#5A6172] leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Formulario de Captura de Clientes */}
        <section id="contacto" className="py-20 px-6 max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold text-[#252B3A] text-center">${site.contact?.title || 'Contáctanos'}</h2>
          {submitted ? (
            <div className="p-4 rounded-xl bg-emerald-100 text-emerald-800 text-center text-sm font-bold">
              ✓ ¡Mensaje recibido! Nos comunicaremos en breve.
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Tu Nombre Completo"
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-white border border-[#DFE3EC] text-[#252B3A] text-sm"
              />
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-white border border-[#DFE3EC] text-[#252B3A] text-sm"
              />
              <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-[#252B3A] bg-[${primary}]">
                Enviar Solicitud
              </button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
`;
}

// Generador de Backend Django (Django REST Framework / Ninja) para Google Drive CMS
function generateDjangoCode(site) {
  const primary = site?.brand_colors?.primary || '#1d7eae';
  return `# ==============================================================================
# Backend Django (Django REST Framework / Ninja) para Vercel Serverless
# Repositorio Central de Datos: Google Drive CMS (/Sitio_Web/Paginas, /Calendario)
# ==============================================================================

# 1. models.py (Modelos de Contenido y Captura de Leads)
from django.db import models

class WebsiteConfig(models.Model):
    site_name = models.CharField(max_length=200, default="${site.site_name || 'MiNegocio'}")
    tagline = models.CharField(max_length=300, default="${site.tagline || ''}")
    industry = models.CharField(max_length=150, default="${site.industry || ''}")
    hero_title = models.CharField(max_length=300, default="${site.hero?.title || site.titulo || ''}")
    hero_subtitle = models.TextField(default="${site.hero?.subtitle || site.resumen_web || ''}")
    primary_color = models.CharField(max_length=10, default="${primary}")
    drive_file_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, default='APPROVED')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.site_name} - {self.status}"

class LeadCapture(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class SocialPostSchedule(models.Model):
    platform = models.CharField(max_length=20, choices=[('facebook', 'Facebook'), ('instagram', 'Instagram')])
    copy_text = models.TextField()
    asset_drive_url = models.CharField(max_length=255, blank=True)
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=20, default='PENDING', choices=[('PENDING', 'Pending Approval'), ('PUBLISHED', 'Published')])
    approved_by = models.CharField(max_length=100, blank=True)

# 2. views.py (Endpoints de API para servir datos hacia el frontend React en Vercel)
from ninja import NinjaAPI, Schema
from typing import List, Optional

api = NinjaAPI(title="Cerebro Digital API", version="1.0.0", description="Backend Django para Google Drive CMS")

class LeadIn(Schema):
    name: str
    email: str
    phone: Optional[str] = ""
    message: Optional[str] = ""

@api.get("/content/drive")
def get_drive_content(request):
    """Lee archivos JSON en /Sitio_Web/Paginas y sirve los props para React"""
    return {
        "site_name": "${site.site_name}",
        "industry": "${site.industry}",
        "tagline": "${site.tagline}",
        "hero": ${JSON.stringify(site.hero || {})},
        "services": ${JSON.stringify(site.services || [])},
        "about": ${JSON.stringify(site.about || {})},
        "contact": ${JSON.stringify(site.contact || {})},
        "status": "APPROVED",
        "source": "Google Drive CMS (/Sitio_Web/Paginas)"
    }

@api.post("/leads/")
def create_lead(request, payload: LeadIn):
    lead = LeadCapture.objects.create(**payload.dict())
    return {"success": True, "lead_id": lead.id, "created_at": str(lead.created_at)}

# 3. urls.py
from django.urls import path

urlpatterns = [
    path("api/", api.urls),
]
`;
}

// Configuración de despliegue en Vercel (vercel.json)
function generateVercelCode() {
  return `{
  "version": 2,
  "name": "myos-growth-operating-system",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "api/**/*.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/$1" }
  ],
  "env": {
    "GOOGLE_DRIVE_FOLDER_ID": "@google_drive_folder_id",
    "DJANGO_SECRET_KEY": "@django_secret_key"
  }
}
`;
}


export default function GeneratedWebsitePreview({
  proposal,
  isApproved,
  onApprove,
  onRegenerate,
  currentUser,
  loading,
  customLogo,
  onLogoUpload,
  onLogoRemove,
  customColors,
  onColorChange,
  designTheme,
  onThemeChange,
  onAiRefine,
  onUpdateSite
}) {
  const [device, setDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [subTab, setSubTab] = useState('preview'); // 'preview' | 'social' | 'drive' | 'code'
  const [codeType, setCodeType] = useState('html'); // 'html' | 'json'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tweakPrompt, setTweakPrompt] = useState('');
  const [attachedRefinePhoto, setAttachedRefinePhoto] = useState(null);
  const logoFileInputRef = useRef(null);
  const refinePhotoInputRef = useRef(null);

  if (!proposal || !proposal.content) return null;

  const site = proposal.content;
  const siteName = site.site_name || site.titulo || 'Mi Negocio PyME';
  const tagline = site.tagline || 'Soluciones de alta conversión';
  const effectiveLogo = customLogo !== undefined ? customLogo : (site.custom_logo || null);
  const primaryColor = customColors?.primary || site.brand_colors?.primary || '#1d7eae';
  const secondaryColor = customColors?.secondary || site.brand_colors?.secondary || '#0032a0';
  const currentTheme = designTheme || site.design_theme || 'dark-modern';

  // Sitio consolidado para exportación HTML y código
  const siteForExport = {
    ...site,
    custom_logo: effectiveLogo,
    design_theme: currentTheme,
    brand_colors: {
      ...site.brand_colors,
      primary: primaryColor,
      secondary: secondaryColor
    }
  };
  // Preferir el HTML real generado por la IA. Usar la plantilla de respaldo solo para propuestas antiguas o incompletas.
  const fullHtmlCode = typeof siteForExport.full_html === 'string' && siteForExport.full_html.trim().startsWith('<!DOCTYPE html')
    ? siteForExport.full_html
    : buildHtmlFallback(siteForExport);

  const handleDownloadHtml = () => {
    const blob = new Blob([fullHtmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_index.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    if (proposal?.id) {
      const opened = window.open(`/preview/${proposal.id}`, '_blank');
      if (!opened) {
        const blob = new Blob([fullHtmlCode], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } else {
      const blob = new Blob([fullHtmlCode], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  const handleRefinePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedRefinePhoto(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const getActiveCode = () => {
    switch (codeType) {
      case 'html': return fullHtmlCode;
      case 'react': return generateReactCode(siteForExport);
      case 'django': return generateDjangoCode(siteForExport);
      case 'vercel': return generateVercelCode();
      case 'json': return JSON.stringify(siteForExport, null, 2);
      default: return fullHtmlCode;
    }
  };

  const handleCopyCode = () => {
    const textToCopy = getActiveCode();
    navigator.clipboard.writeText(textToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const hero = site.hero || {
    badge: '🚀 Solución de Alta Conversión',
    title: site.titulo,
    subtitle: site.resumen_web,
    primary_cta: 'Comenzar Ahora',
    secondary_cta: 'Conocer Más',
    trust_badges: ['Atención 24/7', 'Calidad Garantizada', 'Soporte Dedicado']
  };

  const services = site.services || [
    { title: 'Servicio Principal', description: 'Solución enfocada en resultados comerciales tangibles.', icon: 'Sparkles', badge: 'Destacado' },
    { title: 'Consultoría Especializada', description: 'Acompañamiento técnico paso a paso para su empresa.', icon: 'ShieldCheck', badge: 'Popular' },
    { title: 'Soporte e Integración', description: 'Alta disponibilidad y optimización continua de procesos.', icon: 'TrendingUp', badge: 'Garantizado' }
  ];

  const about = site.about || {
    title: 'Nuestra Propuesta de Valor',
    content: site.resumen_web,
    metrics: [
      { label: 'Clientes Satisfechos', value: '+500' },
      { label: 'Tasa de Éxito', value: '99%' },
      { label: 'Años de Experiencia', value: '10+' }
    ]
  };

  const blogPosts = site.blog_posts || [
    { title: 'Claves para impulsar el crecimiento de su negocio', excerpt: 'Estrategias probadas para optimizar costos y maximizar resultados comerciales.', read_time: '3 min', date: 'Esta semana' },
    { title: 'Tendencias y mejores prácticas de la industria', excerpt: 'Cómo mantenerse a la vanguardia frente a la competencia en el mercado actual.', read_time: '4 min', date: 'Hace unos días' }
  ];

  const contact = site.contact || {
    title: 'Comience Hoy Mismo',
    subtitle: 'Permítanos ayudarle a alcanzar sus objetivos de negocio.',
    phone: '+52 (656) 123-4567',
    email: 'contacto@empresa.com',
    address: 'Av. Tecnológico #1234, Parque Industrial'
  };

  const social = site.social_posts || {
    facebook: {
      copy: site.copy_redes || '¡Conoce nuestro nuevo sitio web y las soluciones que tenemos preparadas para ti!',
      cta: 'Visitar Sitio Web'
    },
    instagram: {
      copy: site.copy_redes || 'Innovación, calidad y resultados en cada proyecto. ✨',
      hashtags: '#Negocio #Exito #Innovacion #Calidad #PyME'
    }
  };

  const getServiceIcon = (iconName) => {
    switch (iconName) {
      case 'Coffee': return Coffee;
      case 'Heart': return Heart;
      case 'Users': return Users;
      case 'TrendingUp': return TrendingUp;
      case 'Cpu': return Cpu;
      case 'BarChart3': return BarChart3;
      case 'Network': return Network;
      case 'ShieldCheck': return ShieldCheck;
      default: return Sparkles;
    }
  };

  const handleLeadSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setLeadForm({ name: '', email: '', phone: '', message: '' });
    }, 4000);
  };

  return (
    <div className="mt-8 rounded-3xl bg-white border border-[#C8CEDB]/80 shadow-2xl overflow-hidden transition-all duration-300">
      
      {/* 1. BARRA SUPERIOR DE SEGURIDAD & ESTADO DE APROBACIÓN HUMANA (Regla de Carlos) */}
      <div className={`px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b ${
        isApproved 
          ? 'bg-emerald-50 border-emerald-200' 
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl flex items-center justify-center ${
            isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {isApproved ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isApproved 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}>
                {isApproved ? 'Aprobado (APPROVED) — Listo para Vercel' : 'Borrador IA (PENDING) — Aprobación Obligatoria'}
              </span>
              <span className="text-[11px] font-mono text-[#5A6172]">ID: #{proposal.id}</span>
            </div>
            <p className="text-xs text-[#3A4256] mt-0.5">
              {isApproved 
                ? `Certificado y firmado para despliegue por ${currentUser?.displayName || 'Auditor Autorizado'}.`
                : 'Restricción de Carlos: Ningún sitio o post se publica sin la firma y registro de un evaluador humano.'}
            </p>
          </div>
        </div>

        {/* Pestañas de vista del Generador */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-[#DFE3EC] self-stretch md:self-auto justify-center">
          <button
            onClick={() => setSubTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'preview' ? 'bg-[#E2554F] text-[#252B3A] shadow-sm' : 'text-[#5A6172] hover:text-[#252B3A]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Sitio Web en Vivo</span>
          </button>
          <button
            onClick={() => setSubTab('social')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'social' ? 'bg-[#E2554F] text-[#252B3A] shadow-sm' : 'text-[#5A6172] hover:text-[#252B3A]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Redes (FB / IG)</span>
          </button>
          <button
            onClick={() => setSubTab('drive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'drive' ? 'bg-[#E2554F] text-[#252B3A] shadow-sm' : 'text-[#5A6172] hover:text-[#252B3A]'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Google Drive</span>
          </button>
          <button
            onClick={() => setSubTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'code' ? 'bg-[#E2554F] text-[#252B3A] shadow-sm' : 'text-[#5A6172] hover:text-[#252B3A]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Vercel / JSON</span>
          </button>
        </div>
      </div>

      {/* 2. SUBTAB 1: VISTA PREVIA INTERACTIVA EN VIVO DEL SITIO WEB GENERADO */}
      {subTab === 'preview' && (
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Input oculto para subir logo */}
          <input
            type="file"
            ref={logoFileInputRef}
            onChange={onLogoUpload}
            accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
            className="hidden"
          />

          {/* Barra de control del simulador de dispositivo y acciones rápidas */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-[#F8F9FC] p-3 rounded-2xl border border-[#DFE3EC] shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="text-xs font-mono text-[#5A6172] ml-1 truncate">
                https://{siteName.toLowerCase().replace(/[^a-z0-9]/g, '')}.myos-platform.vercel.app
              </span>
            </div>

            {/* Controles de Dispositivo y Herramientas Rápidas */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              
              {/* Botón de Subir / Cambiar Logo */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#DFE3EC]">
                {effectiveLogo ? (
                  <>
                    <img
                      src={effectiveLogo}
                      alt="Logo activo"
                      className="w-5 h-5 object-contain rounded bg-white/5"
                    />
                    <span className="text-[11px] font-semibold text-emerald-800">Logo Activo</span>
                    <button
                      onClick={() => logoFileInputRef.current?.click()}
                      title="Cambiar imagen de logo"
                      className="text-[10px] text-[#5A6172] hover:text-[#252B3A] underline ml-1"
                    >
                      Cambiar
                    </button>
                    {onLogoRemove && (
                      <button
                        onClick={onLogoRemove}
                        title="Eliminar logo personalizado"
                        className="p-1 text-[#5A6172] hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => logoFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#D14842] hover:text-[#252B3A] transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Logo</span>
                  </button>
                )}
              </div>

              {/* Botón Editar Textos y Fotos */}
              <button
                onClick={() => setShowEditModal(true)}
                title="Editar cualquier texto o subir fotos personalizadas para este sitio"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F2F4FA] hover:bg-slate-750 text-[#252B3A] border border-[#C8CEDB] hover:border-[#E2554F] transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#D14842]" />
                <span>Editar Textos & Fotos</span>
              </button>

              {/* Botón Alternar Panel de Colores & Diseño */}
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  showColorPicker
                    ? 'bg-[#E2554F] text-[#252B3A] border-[#E2554F] shadow-sm'
                    : 'bg-[#F2F4FA] text-[#3A4256] border-[#C8CEDB] hover:text-[#252B3A]'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Colores & Diseño</span>
              </button>

              {/* Selector de Dispositivos */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#DFE3EC]">
                <button
                  onClick={() => setDevice('desktop')}
                  title="Vista Escritorio"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                    device === 'desktop' ? 'bg-[#E2554F] text-[#252B3A] shadow-sm' : 'text-[#5A6172] hover:text-[#252B3A]'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDevice('tablet')}
                  title="Vista Tablet"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                    device === 'tablet' ? 'bg-[#E2554F] text-[#252B3A] shadow-sm' : 'text-[#5A6172] hover:text-[#252B3A]'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDevice('mobile')}
                  title="Vista Móvil"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                    device === 'mobile' ? 'bg-[#E2554F] text-[#252B3A] shadow-sm' : 'text-[#5A6172] hover:text-[#252B3A]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  title={isFullScreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
                  className="p-1.5 rounded-lg text-[#5A6172] hover:text-[#252B3A] transition"
                >
                  {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Botón Descargar HTML */}
              <button
                onClick={handleDownloadHtml}
                title="Descargar index.html completo"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-850 hover:bg-[#F2F4FA] text-[#3A4256] hover:text-[#252B3A] border border-[#C8CEDB] font-semibold text-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">HTML</span>
              </button>

              {/* BOTÓN PRINCIPAL: ABRIR EN OTRA PESTAÑA */}
              <button
                onClick={handleOpenInNewTab}
                title="Abrir la página web completa en una nueva pestaña del navegador"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-[#252B3A] font-bold text-xs shadow-md transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir en otra pestaña</span>
              </button>
            </div>
          </div>

          {/* PANEL DESPLEGABLE: ESTUDIO DE COLOR Y DISEÑO EN TIEMPO REAL */}
          {showColorPicker && (
            <div className="p-4 rounded-2xl bg-white border border-[#E2554F]/40 space-y-3.5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#DFE3EC] pb-2.5">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#D14842]" />
                  <span className="text-xs font-bold text-[#252B3A] uppercase tracking-wider">
                    Personalizador de Color & Estilo en Vivo
                  </span>
                </div>
                <span className="text-[11px] text-[#5A6172]">
                  Cambia los colores al instante o usa el selector hexadecimal.
                </span>
              </div>

              {/* 1. Muestras de colores predefinidas */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#5A6172] block">
                  Paletas Profesionales de Alta Conversión:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: 'Azul Tech', primary: '#1d7eae', secondary: '#0032a0' },
                    { label: 'Verde Salud', primary: '#059669', secondary: '#065f46' },
                    { label: 'Naranja Gourmet', primary: '#ea580c', secondary: '#c2410c' },
                    { label: 'Púrpura SaaS', primary: '#7c3aed', secondary: '#5b21b6' },
                    { label: 'Rosa Moda', primary: '#db2777', secondary: '#9d174d' },
                    { label: 'Ámbar Oro & Lujo', primary: '#d97706', secondary: '#78350f' },
                    { label: 'Rojo Energía', primary: '#dc2626', secondary: '#991b1b' },
                    { label: 'Turquesa Aqua', primary: '#0891b2', secondary: '#0e7490' }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onColorChange?.(p.primary, p.secondary)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition border ${
                        primaryColor === p.primary
                          ? 'bg-[#F2F4FA] text-[#252B3A] border-white/60 ring-2 ring-[#1d7eae]'
                          : 'bg-white text-[#3A4256] border-[#DFE3EC] hover:border-[#C8CEDB]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block shadow-sm border border-white/20"
                        style={{ backgroundColor: p.primary }}
                      ></span>
                      <span>{p.label}</span>
                    </button>
                  ))}

                  {/* Selector de color HEX nativo */}
                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white border border-[#DFE3EC] hover:border-[#C8CEDB] text-[#3A4256] cursor-pointer">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => onColorChange?.(e.target.value)}
                      className="w-4 h-4 p-0 border-0 bg-transparent rounded cursor-pointer"
                    />
                    <span className="font-mono text-[11px]">{primaryColor}</span>
                    <span className="text-[10px] text-[#5A6172]">(Personalizado)</span>
                  </label>
                </div>
              </div>

              {/* 2. Selector de Estilo Visual / Tema */}
              <div className="space-y-1.5 pt-1 border-t border-[#DFE3EC]/80">
                <span className="text-[11px] font-semibold text-[#5A6172] block">
                  Estilo Visual de la Página:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { id: 'dark-modern', label: '🌙 Oscuro Moderno (Glassmorphism)', desc: 'Fondo negro grafito con contrastes neón' },
                    { id: 'light-clean', label: '☀️ Claro Minimalista (Clean Editorial)', desc: 'Fondo perla claro, lectura fresca' },
                    { id: 'corporate-navy', label: '👔 Ejecutivo Navy (Deep Slate)', desc: 'Azul marino corporativo sobrio' },
                    { id: 'luxury-gold', label: '👑 Lujo & Alta Gama (Obsidian & Gold)', desc: 'Negro obsidian con detalles dorados' }
                  ].map((thm) => (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => onThemeChange?.(thm.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        currentTheme === thm.id
                          ? 'bg-[#E2554F] text-[#252B3A] border-[#E2554F] shadow-sm'
                          : 'bg-white text-[#3A4256] border-[#DFE3EC] hover:border-[#C8CEDB]'
                      }`}
                    >
                      {thm.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ASISTENTE RÁPIDO: PEDIR CAMBIO DE COLOR, DISEÑO O TEXTO A LA IA */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-[#DFE3EC] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#252B3A] flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-[#D14842]" />
                <span>¿Quieres pedirle otro color, diseño, texto o agregar fotos con la IA?</span>
              </span>
              <span className="text-[10px] text-[#5A6172]">Instrucción en lenguaje natural</span>
            </div>

            {/* Vista previa de foto adjunta para la IA */}
            {attachedRefinePhoto && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-emerald-200">
                <div className="flex items-center gap-2.5">
                  <img src={attachedRefinePhoto} alt="Foto adjunta" className="w-10 h-10 object-cover rounded-lg border border-[#C8CEDB]" />
                  <div className="text-[11px]">
                    <span className="font-bold text-emerald-800 block">✓ Foto adjunta para incorporar al diseño</span>
                    <span className="text-[#5A6172] block text-[10px]">La IA colocará esta imagen en la sección que le indiques en el prompt</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedRefinePhoto(null)}
                  className="p-1.5 text-[#5A6172] hover:text-red-400 transition"
                  title="Eliminar foto adjunta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <input
              type="file"
              ref={refinePhotoInputRef}
              onChange={handleRefinePhotoUpload}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => refinePhotoInputRef.current?.click()}
                title="Subir foto desde tu dispositivo para que la IA la agregue a la página"
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-850 text-[#3A4256] hover:text-[#252B3A] border border-[#DFE3EC] text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#D14842]" />
                <span className="hidden sm:inline">Adjuntar Foto</span>
              </button>

              <input
                type="text"
                value={tweakPrompt}
                onChange={(e) => setTweakPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (tweakPrompt.trim() || attachedRefinePhoto) && onAiRefine) {
                    onAiRefine(tweakPrompt, attachedRefinePhoto);
                    setTweakPrompt('');
                    setAttachedRefinePhoto(null);
                  }
                }}
                placeholder="Ej: Agrega esta foto a la portada y cambia los textos para decir que atendemos urgencias..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#DFE3EC] text-xs text-[#252B3A] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
              />
              <button
                type="button"
                disabled={loading || (!tweakPrompt.trim() && !attachedRefinePhoto) || !onAiRefine}
                onClick={() => {
                  if ((tweakPrompt.trim() || attachedRefinePhoto) && onAiRefine) {
                    onAiRefine(tweakPrompt, attachedRefinePhoto);
                    setTweakPrompt('');
                    setAttachedRefinePhoto(null);
                  }
                }}
                className="px-4 py-2 rounded-xl font-bold text-xs text-[#252B3A] bg-gradient-to-r from-[#1d7eae] to-[#0032a0] hover:opacity-95 disabled:opacity-50 transition shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? 'Ajustando...' : 'Aplicar con IA'}</span>
              </button>
            </div>

            {/* Sugerencias Rápidas con 1 Clic */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5A6172]">
              <span className="font-semibold text-[#5A6172] mr-1">Sugerencias:</span>
              {[
                { label: '🌟 Tonos Dorados & Lujo', prompt: 'Cambia los colores a dorado y ámbar con estilo lujoso de alta gama.' },
                { label: '🌿 Verde Esmeralda & Salud', prompt: 'Usa una paleta verde esmeralda y naturaleza con estilo fresco y confiable.' },
                { label: '☀️ Estilo Claro Minimalista', prompt: 'Haz el diseño minimalista, limpio con fondo claro y tipografía editorial.' },
                { label: '🔥 Naranja Gourmet & Fuego', prompt: 'Usa colores naranja cálido y tonos brasas con estilo dinámico y apetecible.' },
                { label: '🟣 Neón Cyber & SaaS', prompt: 'Aplica colores morados y violeta futurista estilo startup tecnológica.' }
              ].map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (onAiRefine) {
                      onAiRefine(sug.prompt);
                    }
                  }}
                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-[#F2F4FA] text-[#3A4256] hover:text-[#252B3A] transition border border-[#DFE3EC] text-[10px]"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vista previa del HTML generado realmente por la IA */}
          <div className={`mx-auto overflow-hidden transition-all duration-300 bg-white shadow-2xl ${
            device === 'mobile' ? 'max-w-sm rounded-[32px] border-4 border-[#C8CEDB] p-1.5' :
            device === 'tablet' ? 'max-w-2xl rounded-3xl border-4 border-[#C8CEDB] p-1.5' :
            'w-full rounded-2xl border border-[#DFE3EC]'
          }`}>
            <iframe
              key={`${proposal?.id || siteName}-${device}-${fullHtmlCode.length}`}
              title={`Vista previa del sitio: ${siteName}`}
              srcDoc={fullHtmlCode}
              sandbox="allow-scripts allow-forms allow-popups"
              loading="eager"
              className="block w-full bg-white"
              style={{ height: device === 'mobile' ? '760px' : device === 'tablet' ? '850px' : '900px', border: 0 }}
            />
          </div>
        </div>
      )}

      {/* 3. SUBTAB 2: PUBLICACIONES PARA REDES SOCIALES (FACEBOOK & INSTAGRAM) */}
      {subTab === 'social' && (
        <div className="p-6 space-y-6">
          <div className="border-b border-[#DFE3EC] pb-3 flex justify-between items-center">
            <div>
              <h4 className="text-base font-bold text-[#252B3A]">Estrategia en Redes Sociales (Facebook e Instagram)</h4>
              <p className="text-xs text-[#5A6172]">Cumplimiento del MVP: Publicaciones generadas con gancho, CTA y hashtags antes de enviar a Meta Graph API.</p>
            </div>
            <span className="text-xs font-mono text-[#5A6172]">📁 /Redes_Sociales/{isApproved ? 'Publicado' : 'Para_Publicar'}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Mockup Facebook */}
            <div className="bg-[#18191a] border border-[#DFE3EC] rounded-2xl p-4 space-y-3 text-[#252B3A] shadow-xl">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#DFE3EC]/80">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-[#252B3A]">
                  f
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[#252B3A]">{siteName}</h5>
                  <span className="text-[10px] text-[#5A6172]">Publicación patrocinada • Hace 2 min</span>
                </div>
              </div>

              <p className="text-xs text-[#252B3A] leading-relaxed whitespace-pre-line">
                {social.facebook?.copy}
              </p>

              {/* Tarjeta de Enlace en Facebook */}
              <div className="rounded-xl overflow-hidden border border-[#DFE3EC] bg-white">
                <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center p-4 text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#D14842]">{site.industry}</span>
                    <h6 className="font-bold text-[#252B3A] text-xs">{hero.title}</h6>
                  </div>
                </div>
                <div className="p-3 bg-white flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-[#5A6172] uppercase">myos-platform.vercel.app</span>
                    <p className="font-bold text-xs text-[#252B3A]">{siteName}</p>
                  </div>
                  <button className="px-3 py-1 rounded-md text-[11px] font-bold bg-[#F2F4FA] text-[#252B3A] border border-[#C8CEDB]">
                    {social.facebook?.cta || 'Más información'}
                  </button>
                </div>
              </div>

              <div className="flex justify-around pt-2 border-t border-[#DFE3EC] text-xs text-[#5A6172]">
                <span className="flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5 text-blue-400" /> Me gusta</span>
                <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Comentar</span>
                <span className="flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" /> Compartir</span>
              </div>
            </div>

            {/* Mockup Instagram */}
            <div className="bg-white border border-[#DFE3EC] rounded-2xl p-4 space-y-3 text-[#252B3A] shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#DFE3EC]/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#252B3A]">
                      IG
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#252B3A]">{siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}</h5>
                    <span className="text-[10px] text-[#5A6172]">Original Audio</span>
                  </div>
                </div>
                <span className="text-xs text-[#5A6172] font-bold">•••</span>
              </div>

              {/* Imagen / Arte Generado */}
              <div className="rounded-xl overflow-hidden bg-white border border-[#DFE3EC] p-6 text-center space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-[#D14842]" />
                <span className="text-[10px] font-bold uppercase text-[#D14842] block">Prompt de Arte para Generación</span>
                <p className="text-xs text-[#3A4256] italic max-w-sm mx-auto">
                  "{site.prompt_imagen || 'Fotografía profesional en iluminación de alta fidelidad 8k estilo publicitario.'}"
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-[#3A4256]">
                <p>
                  <strong className="text-[#252B3A] mr-1.5">{siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}</strong>
                  {social.instagram?.copy}
                </p>
                <p className="text-[#D14842] font-medium text-[11px] leading-relaxed">
                  {social.instagram?.hashtags}
                </p>
              </div>
            </div>

          </div>

          {/* Calendario Editorial de Redes Sociales (Sincronizado con /Calendario en Drive) */}
          <div className="bg-white border border-[#DFE3EC] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#DFE3EC] pb-3">
              <div>
                <h5 className="font-bold text-sm text-[#252B3A] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1d7eae]" />
                  <span>Calendario de Contenidos — Archivo de Control en Drive (/Calendario)</span>
                </h5>
                <p className="text-xs text-[#5A6172]">
                  Programación automatizada para Meta Graph API / Make. Estado actual: <span className={isApproved ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>{isApproved ? "Listo para Disparo" : "En Espera de Firma Humana"}</span>
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#F2F4FA] text-[#D14842] border border-[#C8CEDB]">
                /Calendario/cronograma_editorial.json
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DFE3EC] text-[#5A6172]">
                    <th className="pb-2 font-semibold">Red Social</th>
                    <th className="pb-2 font-semibold">Programación</th>
                    <th className="pb-2 font-semibold">Formato</th>
                    <th className="pb-2 font-semibold">Artes Asignados</th>
                    <th className="pb-2 font-semibold">Ruta / Enlace</th>
                    <th className="pb-2 font-semibold text-right">Estado Meta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[#3A4256]">
                  <tr>
                    <td className="py-2.5 font-bold text-blue-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Facebook
                    </td>
                    <td className="py-2.5 text-[#3A4256]">Hoy, 18:30 hrs</td>
                    <td className="py-2.5">Post con Enlace Web</td>
                    <td className="py-2.5 font-mono text-[11px] text-[#5A6172]">/Redes_Sociales/{isApproved ? 'Publicado' : 'Para_Publicar'}/arte_fb_01.jpg</td>
                    <td className="py-2.5 text-[#D14842] font-mono">/servicios</td>
                    <td className="py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-500/30' : 'bg-amber-100 text-amber-800 border border-amber-500/30'
                      }`}>
                        {isApproved ? 'APPROVED' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-pink-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-500"></span> Instagram
                    </td>
                    <td className="py-2.5 text-[#3A4256]">Mañana, 12:00 hrs</td>
                    <td className="py-2.5">Carrusel de 3 Slides</td>
                    <td className="py-2.5 font-mono text-[11px] text-[#5A6172]">/Redes_Sociales/{isApproved ? 'Publicado' : 'Para_Publicar'}/carrusel_ig_01.jpg</td>
                    <td className="py-2.5 text-[#D14842] font-mono">/inicio#servicios</td>
                    <td className="py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-500/30' : 'bg-amber-100 text-amber-800 border border-amber-500/30'
                      }`}>
                        {isApproved ? 'APPROVED' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 4. SUBTAB 3: GOOGLE DRIVE HEADLESS CMS */}
      {subTab === 'drive' && (
        <div className="p-6 space-y-4">
          <div className="border-b border-[#DFE3EC] pb-3 flex justify-between items-center">
            <div>
              <h4 className="text-base font-bold text-[#252B3A]">Estructura de Archivos en Google Drive (Headless CMS)</h4>
              <p className="text-xs text-[#5A6172]">Especificación de Carlos: Archivos sincronizados automáticamente con el repositorio central.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-[#D14842] border border-blue-500/30 font-mono">
              Drive Sync v1.0
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            
            {/* Carpeta /Marca requerida por la arquitectura */}
            <div className="p-4 rounded-xl bg-white border border-[#DFE3EC] space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#252B3A]">
                  <Image className="w-4 h-4 text-[#1d7eae]" />
                  <span>📁 /Marca (Logotipos Oficiales, Códigos Hex y Manual de Identidad)</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {effectiveLogo ? '✓ Logo Oficial Sincronizado' : 'Insignia Base Sincronizada'}
                </span>
              </div>
              <p className="text-xs text-[#5A6172]">
                Fuente central de verdad para la identidad corporativa utilizada por Django y React:
              </p>
              <div className="grid sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-white border border-[#DFE3EC] flex items-center gap-3">
                  {effectiveLogo ? (
                    <img src={effectiveLogo} alt="Logo Oficial" className="w-10 h-10 object-contain rounded bg-white/5 p-1 border border-[#C8CEDB]" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[#252B3A] text-sm" style={{ backgroundColor: primaryColor }}>
                      {siteName.charAt(0)}
                    </div>
                  )}
                  <div className="text-[11px] truncate">
                    <span className="font-bold text-[#252B3A] block truncate">/Marca/logo_oficial.png</span>
                    <span className="text-[10px] text-[#5A6172]">{effectiveLogo ? 'Imagen subida por usuario' : 'Insignia corporativa'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#DFE3EC] space-y-1 text-[11px]">
                  <span className="font-bold text-[#252B3A] block">/Marca/colores_hex.json</span>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full inline-block border border-white/20" style={{ backgroundColor: primaryColor }} title={primaryColor}></span>
                    <span className="font-mono text-[10px] text-[#5A6172]">{primaryColor} (Primario)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full inline-block border border-white/20" style={{ backgroundColor: secondaryColor }} title={secondaryColor}></span>
                    <span className="font-mono text-[10px] text-[#5A6172]">{secondaryColor} (Secundario)</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#DFE3EC] space-y-1 text-[11px]">
                  <span className="font-bold text-[#252B3A] block">/Marca/manual_de_voz.md</span>
                  <span className="text-[10px] text-[#5A6172] block">Tipografía: Plus Jakarta Sans</span>
                  <span className="text-[10px] text-[#D14842] block">Tono: {site.industry || 'PyME'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#DFE3EC] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#252B3A]">
                <FolderTree className="w-4 h-4 text-[#1d7eae]" />
                <span>📁 /Sitio_Web/Paginas</span>
              </div>
              <p className="text-xs text-[#5A6172]">
                Archivo: <code className="text-[#D14842]">landing_{siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json</code>
              </p>
              <div className="text-[11px] bg-white p-2.5 rounded-lg border border-[#DFE3EC]/80 font-mono text-[#3A4256] space-y-1">
                <div>✓ Hero props (badge, title, subtitle, CTAs)</div>
                <div>✓ Array de servicios ({services.length} items con iconos)</div>
                <div>✓ Formulario de captura y datos de contacto</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#DFE3EC] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#252B3A]">
                <FileText className="w-4 h-4 text-[#1d7eae]" />
                <span>📁 /Sitio_Web/Blog</span>
              </div>
              <p className="text-xs text-[#5A6172]">
                Artículos generados en formato Markdown listos para renderizar:
              </p>
              <div className="text-[11px] bg-white p-2.5 rounded-lg border border-[#DFE3EC]/80 font-mono text-[#3A4256] space-y-1">
                {blogPosts.map((b, i) => (
                  <div key={i} className="truncate">✓ articulo_0{i+1}_{b.title.slice(0, 20).replace(/\s+/g, '_')}.md</div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#DFE3EC] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#252B3A]">
                <Share2 className="w-4 h-4 text-[#1d7eae]" />
                <span>📁 /Redes_Sociales/{isApproved ? 'Publicado' : 'Para_Publicar'}</span>
              </div>
              <p className="text-xs text-[#5A6172]">
                Estado: <span className={isApproved ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {isApproved ? 'Aprobado y sellado en histórico' : 'Borrador en bandeja de espera'}
                </span>
              </p>
              <div className="text-[11px] bg-white p-2.5 rounded-lg border border-[#DFE3EC]/80 font-mono text-[#3A4256]">
                Payload formateado para webhook hacia Meta Graph API / Make.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#DFE3EC] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#252B3A]">
                <Calendar className="w-4 h-4 text-[#1d7eae]" />
                <span>📁 /Calendario</span>
              </div>
              <p className="text-xs text-[#5A6172]">
                Programación editorial automática registrada con fecha y hora.
              </p>
              <div className="text-[11px] bg-white p-2.5 rounded-lg border border-[#DFE3EC]/80 font-mono text-[#3A4256]">
                Disparo agendado tras confirmación humana del auditor.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUBTAB 4: CÓDIGO FUENTE HTML5 Y ESPECIFICACIÓN JSON */}
      {subTab === 'code' && (
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DFE3EC] pb-4">
            <div>
              <h4 className="text-base font-bold text-[#252B3A] flex items-center gap-2">
                <span>Código Fuente Generado por IA</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-500/30">
                  Listo para Producción
                </span>
              </h4>
              <p className="text-xs text-[#5A6172]">
                Página web completa en HTML5 con Tailwind CSS o especificación JSON para React y Vercel.
              </p>
            </div>

            {/* Selector de Formato Full Stack */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="p-1 rounded-xl bg-white border border-[#DFE3EC] flex flex-wrap items-center gap-1">
                <button
                  onClick={() => setCodeType('html')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    codeType === 'html' ? 'bg-[#E2554F] text-[#252B3A] shadow-sm' : 'text-[#5A6172] hover:text-[#252B3A]'
                  }`}
                >
                  HTML5 (index.html)
                </button>
                <button
                  onClick={() => setCodeType('react')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    codeType === 'react' ? 'bg-[#E2554F] text-[#252B3A] shadow-sm' : 'text-[#5A6172] hover:text-[#252B3A]'
                  }`}
                >
                  React (Next.js)
                </button>
                <button
                  onClick={() => setCodeType('django')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    codeType === 'django' ? 'bg-[#E2554F] text-[#252B3A] shadow-sm' : 'text-[#5A6172] hover:text-[#252B3A]'
                  }`}
                >
                  Django (API)
                </button>
                <button
                  onClick={() => setCodeType('vercel')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    codeType === 'vercel' ? 'bg-[#E2554F] text-[#252B3A] shadow-sm' : 'text-[#5A6172] hover:text-[#252B3A]'
                  }`}
                >
                  vercel.json
                </button>
                <button
                  onClick={() => setCodeType('json')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    codeType === 'json' ? 'bg-[#E2554F] text-[#252B3A] shadow-sm' : 'text-[#5A6172] hover:text-[#252B3A]'
                  }`}
                >
                  Drive JSON
                </button>
              </div>

              {codeType === 'html' && (
                <>
                  <button
                    onClick={handleDownloadHtml}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-[#252B3A] shadow-md shadow-emerald-600/20 transition"
                    title="Descargar index.html autónomo"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar index.html</span>
                  </button>
                  <button
                    onClick={handleOpenInNewTab}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F2F4FA] hover:bg-[#EEF0F6] text-xs font-semibold text-[#252B3A] border border-[#C8CEDB] transition"
                    title="Ver página en nueva pestaña"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Abrir</span>
                  </button>
                </>
              )}

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F2F4FA] hover:bg-[#EEF0F6] text-xs font-semibold text-[#252B3A] border border-[#C8CEDB] transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-3 right-3 text-[10px] font-mono px-2 py-1 rounded bg-white/90 text-[#5A6172] border border-[#DFE3EC]">
              {codeType === 'html' && 'HTML5 + Tailwind CSS CDN (Descarga directa)'}
              {codeType === 'react' && 'React / Next.js Component (Tailwind SSR/SSG)'}
              {codeType === 'django' && 'Django REST / Ninja (Modelos & Endpoints para Drive CMS)'}
              {codeType === 'vercel' && 'Vercel Serverless Build & Routing (vercel.json)'}
              {codeType === 'json' && 'Google Drive CMS Headless Payload'}
            </div>
            <pre className="p-4 rounded-xl bg-white border border-[#DFE3EC] text-[11px] font-mono text-[#D14842] overflow-x-auto max-h-96 overflow-y-auto leading-relaxed">
              {getActiveCode()}
            </pre>
          </div>
        </div>
      )}

      {/* 6. PIE DE AUDITORÍA HUMANA & APROBACIÓN OBLIGATORIA */}
      <div className="px-6 py-4 bg-white border-t border-[#DFE3EC] flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-xs text-[#5A6172]">
          Evaluador asignado: <strong className="text-[#252B3A]">{currentUser?.displayName || 'Auditor'}</strong> ({currentUser?.email})
        </div>

        {!isApproved ? (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onRegenerate}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-[#F2F4FA] text-[#3A4256] border border-[#C8CEDB] transition"
            >
              🔄 Volver a Generar
            </button>
            <button
              onClick={onApprove}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-[#252B3A] shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aprobar Sitio Web & Certificar Publicación</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>Aprobado por {currentUser?.displayName || 'Auditor'} • Despliegue Habilitado</span>
          </div>
        )}
      </div>

      {/* Modal para Editar Textos y Subir Fotos */}
      <EditContentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        siteData={siteForExport}
        onSave={(updatedSite) => {
          if (onUpdateSite) {
            onUpdateSite(updatedSite);
          }
        }}
      />
    </div>
  );
}
