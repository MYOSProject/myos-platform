import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
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
  ArrowRight
} from 'lucide-react';

export default function GeneratedWebsitePreview({
  proposal,
  isApproved,
  onApprove,
  onRegenerate,
  currentUser,
  loading
}) {
  const [device, setDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [subTab, setSubTab] = useState('preview'); // 'preview' | 'social' | 'drive' | 'code'
  const [copiedCode, setCopiedCode] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', message: '' });

  if (!proposal || !proposal.content) return null;

  const site = proposal.content;
  const siteName = site.site_name || site.titulo || 'Mi Negocio PyME';
  const tagline = site.tagline || 'Soluciones de alta conversión';
  const primaryColor = site.brand_colors?.primary || '#1d7eae';
  const secondaryColor = site.brand_colors?.secondary || '#0032a0';

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(JSON.stringify(site, null, 2));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
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
    <div className="mt-8 rounded-3xl bg-slate-950 border border-slate-700/80 shadow-2xl overflow-hidden transition-all duration-300">
      
      {/* 1. BARRA SUPERIOR DE SEGURIDAD & ESTADO DE APROBACIÓN HUMANA (Regla de Carlos) */}
      <div className={`px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b ${
        isApproved 
          ? 'bg-emerald-950/40 border-emerald-500/40' 
          : 'bg-amber-950/40 border-amber-500/40'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl flex items-center justify-center ${
            isApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {isApproved ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isApproved 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {isApproved ? 'Aprobado (APPROVED) — Listo para Vercel' : 'Borrador IA (PENDING) — Aprobación Obligatoria'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">ID: #{proposal.id}</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isApproved 
                ? `Certificado y firmado para despliegue por ${currentUser?.displayName || 'Auditor Autorizado'}.`
                : 'Restricción de Carlos: Ningún sitio o post se publica sin la firma y registro de un evaluador humano.'}
            </p>
          </div>
        </div>

        {/* Pestañas de vista del Generador */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-stretch md:self-auto justify-center">
          <button
            onClick={() => setSubTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'preview' ? 'bg-[#1d7eae] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Sitio Web en Vivo</span>
          </button>
          <button
            onClick={() => setSubTab('social')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'social' ? 'bg-[#1d7eae] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Redes (FB / IG)</span>
          </button>
          <button
            onClick={() => setSubTab('drive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'drive' ? 'bg-[#1d7eae] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Google Drive</span>
          </button>
          <button
            onClick={() => setSubTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'code' ? 'bg-[#1d7eae] text-white shadow-sm' : 'text-slate-400 hover:text-white'
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
          
          {/* Barra de control del simulador de dispositivo */}
          <div className="flex justify-between items-center bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">
                https://{siteName.toLowerCase().replace(/[^a-z0-9]/g, '')}.myos-platform.vercel.app
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Vista previa:</span>
              <button
                onClick={() => setDevice('desktop')}
                title="Vista Escritorio"
                className={`p-1.5 rounded-lg transition ${
                  device === 'desktop' ? 'bg-[#1d7eae] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Laptop className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDevice('mobile')}
                title="Vista Móvil"
                className={`p-1.5 rounded-lg transition ${
                  device === 'mobile' ? 'bg-[#1d7eae] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Marco del dispositivo renderizado */}
          <div className={`mx-auto transition-all duration-300 ${
            device === 'mobile' 
              ? 'max-w-sm rounded-[40px] border-4 border-slate-700 bg-slate-900 shadow-2xl p-2' 
              : 'w-full rounded-2xl border border-slate-800'
          }`}>
            <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden font-sans border border-slate-800/80">
              
              {/* Navbar del sitio web generado */}
              <nav className="bg-slate-950/90 backdrop-blur-md px-5 py-3.5 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {siteName.slice(0, 1)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white tracking-tight leading-tight">{siteName}</h4>
                    <span className="text-[10px] text-slate-400 block leading-none">{tagline || site.industry || 'PyME'}</span>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-300">
                  <a href="#hero" className="hover:text-white transition">Inicio</a>
                  <a href="#servicios" className="hover:text-white transition">Servicios</a>
                  <a href="#nosotros" className="hover:text-white transition">Nosotros</a>
                  <a href="#blog" className="hover:text-white transition">Blog</a>
                  <a href="#contacto" className="hover:text-white transition">Contacto</a>
                </div>

                <a 
                  href="#contacto"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition shadow-sm hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  {hero.primary_cta || 'Contacto'}
                </a>
              </nav>

              {/* SECCIÓN 1: HERO */}
              <section id="hero" className="px-6 py-12 md:py-16 text-center space-y-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-[#98dae9]" />
                  <span>{hero.badge}</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white max-w-3xl mx-auto leading-tight">
                  {hero.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  {hero.subtitle}
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
                  <a
                    href="#contacto"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>{hero.primary_cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="#servicios"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition"
                  >
                    {hero.secondary_cta}
                  </a>
                </div>

                {/* Sellos de Confianza */}
                <div className="flex flex-wrap justify-center items-center gap-4 pt-4 text-xs text-slate-400">
                  {hero.trust_badges?.map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{badge}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECCIÓN 2: SERVICIOS / PRODUCTOS */}
              <section id="servicios" className="px-6 py-12 space-y-8 bg-slate-900/60 border-b border-slate-800">
                <div className="text-center space-y-2 max-w-xl mx-auto">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#98dae9]">Soluciones Especializadas</span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">Nuestros Servicios Principales</h2>
                  <p className="text-xs text-slate-400">Diseñados para brindar alta conversión y valor comercial inmediato a cada cliente.</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {services.map((srv, idx) => {
                    const IconComp = getServiceIcon(srv.icon);
                    return (
                      <div 
                        key={idx}
                        className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition group space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                            style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>
                          {srv.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {srv.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-white text-sm">{srv.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{srv.description}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SECCIÓN 3: PROPUESTA DE VALOR / NOSOTROS */}
              <section id="nosotros" className="px-6 py-12 space-y-8 bg-slate-950 border-b border-slate-800">
                <div className="max-w-3xl mx-auto space-y-6 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#98dae9]">Compromiso & Experiencia</span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{about.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line text-left bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                    {about.content}
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {about.metrics?.map((m, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-lg sm:text-xl font-black text-white block" style={{ color: primaryColor }}>
                          {m.value}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* SECCIÓN 4: ARTÍCULOS DE BLOG (/Sitio_Web/Blog) */}
              <section id="blog" className="px-6 py-12 space-y-6 bg-slate-900/40 border-b border-slate-800">
                <div className="flex justify-between items-end max-w-4xl mx-auto">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#98dae9]">Contenidos & Recursos</span>
                    <h2 className="text-xl font-black text-white">Últimas Publicaciones del Blog</h2>
                  </div>
                  <span className="text-xs font-mono text-slate-400">📁 /Sitio_Web/Blog</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {blogPosts.map((post, idx) => (
                    <article key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-slate-700 transition">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3 text-[#1d7eae]" />
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.read_time} de lectura</span>
                      </div>
                      <h3 className="font-bold text-white text-sm hover:text-[#98dae9] transition cursor-pointer">{post.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{post.excerpt}</p>
                    </article>
                  ))}
                </div>
              </section>

              {/* SECCIÓN 5: FORMULARIO DE CONTACTO / LEAD CAPTURE */}
              <section id="contacto" className="px-6 py-12 bg-slate-950 space-y-6">
                <div className="max-w-xl mx-auto text-center space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#98dae9]">Conversemos</span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{contact.title}</h2>
                  <p className="text-xs text-slate-400">{contact.subtitle}</p>
                </div>

                <div className="max-w-lg mx-auto bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                  {contactSubmitted ? (
                    <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-center text-xs space-y-1">
                      <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                      <p className="font-bold">¡Solicitud recibida con éxito!</p>
                      <p className="text-slate-400">El equipo se pondrá en contacto a la brevedad.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleLeadSubmit} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          required
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                          placeholder="Tu nombre"
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                          <input
                            type="email"
                            required
                            value={leadForm.email}
                            onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                            placeholder="correo@ejemplo.com"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Teléfono</label>
                          <input
                            type="tel"
                            value={leadForm.phone}
                            onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                            placeholder="(656) 000-0000"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">¿Cómo podemos ayudarte?</label>
                        <textarea
                          rows={2}
                          value={leadForm.message}
                          onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                          placeholder="Escribe tu mensaje o solicitud..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl font-bold text-xs text-white transition shadow-md flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Mensaje de Contacto</span>
                      </button>
                    </form>
                  )}

                  <div className="pt-3 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3 h-3 text-[#1d7eae]" />
                        <span>{contact.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-[#1d7eae]" />
                        <span>{contact.email}</span>
                      </div>
                    </div>
                    {contact.address && (
                      <div className="flex items-center gap-1.5 truncate text-[10px] text-slate-500 pt-0.5">
                        <MapPin className="w-3 h-3 text-[#1d7eae] shrink-0" />
                        <span className="truncate">{contact.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* FOOTER DEL SITIO GENERADO */}
              <footer className="bg-slate-950 px-6 py-6 border-t border-slate-800 text-center text-[11px] text-slate-500">
                <p>© {new Date().getFullYear()} {siteName}. Todos los derechos reservados.</p>
                <p className="mt-1 text-[10px] text-slate-600">Generado autónomamente por MYOS Platform (GrowthLab Merkatics)</p>
              </footer>

            </div>
          </div>
        </div>
      )}

      {/* 3. SUBTAB 2: PUBLICACIONES PARA REDES SOCIALES (FACEBOOK & INSTAGRAM) */}
      {subTab === 'social' && (
        <div className="p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h4 className="text-base font-bold text-white">Estrategia en Redes Sociales (Facebook e Instagram)</h4>
              <p className="text-xs text-slate-400">Cumplimiento del MVP: Publicaciones generadas con gancho, CTA y hashtags antes de enviar a Meta Graph API.</p>
            </div>
            <span className="text-xs font-mono text-slate-400">📁 /Redes_Sociales/{isApproved ? 'Publicado' : 'Para_Publicar'}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Mockup Facebook */}
            <div className="bg-[#18191a] border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-100 shadow-xl">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                  f
                </div>
                <div>
                  <h5 className="font-bold text-xs text-white">{siteName}</h5>
                  <span className="text-[10px] text-slate-400">Publicación patrocinada • Hace 2 min</span>
                </div>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                {social.facebook?.copy}
              </p>

              {/* Tarjeta de Enlace en Facebook */}
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center p-4 text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#98dae9]">{site.industry}</span>
                    <h6 className="font-bold text-white text-xs">{hero.title}</h6>
                  </div>
                </div>
                <div className="p-3 bg-slate-950 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">myos-platform.vercel.app</span>
                    <p className="font-bold text-xs text-white">{siteName}</p>
                  </div>
                  <button className="px-3 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-white border border-slate-700">
                    {social.facebook?.cta || 'Más información'}
                  </button>
                </div>
              </div>

              <div className="flex justify-around pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5 text-blue-400" /> Me gusta</span>
                <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Comentar</span>
                <span className="flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" /> Compartir</span>
              </div>
            </div>

            {/* Mockup Instagram */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 text-slate-100 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-[10px] font-bold text-white">
                      IG
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-white">{siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}</h5>
                    <span className="text-[10px] text-slate-400">Original Audio</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-bold">•••</span>
              </div>

              {/* Imagen / Arte Generado */}
              <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 p-6 text-center space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-[#98dae9]" />
                <span className="text-[10px] font-bold uppercase text-[#98dae9] block">Prompt de Arte para Generación</span>
                <p className="text-xs text-slate-300 italic max-w-sm mx-auto">
                  "{site.prompt_imagen || 'Fotografía profesional en iluminación de alta fidelidad 8k estilo publicitario.'}"
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <p>
                  <strong className="text-white mr-1.5">{siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}</strong>
                  {social.instagram?.copy}
                </p>
                <p className="text-[#98dae9] font-medium text-[11px] leading-relaxed">
                  {social.instagram?.hashtags}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. SUBTAB 3: GOOGLE DRIVE HEADLESS CMS */}
      {subTab === 'drive' && (
        <div className="p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h4 className="text-base font-bold text-white">Estructura de Archivos en Google Drive (Headless CMS)</h4>
              <p className="text-xs text-slate-400">Especificación de Carlos: Archivos sincronizados automáticamente con el repositorio central.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-[#98dae9] border border-blue-500/30 font-mono">
              Drive Sync v1.0
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <FolderTree className="w-4 h-4 text-[#1d7eae]" />
                <span>📁 /Sitio_Web/Paginas</span>
              </div>
              <p className="text-xs text-slate-400">
                Archivo: <code className="text-[#98dae9]">landing_{siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json</code>
              </p>
              <div className="text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-slate-300 space-y-1">
                <div>✓ Hero props (badge, title, subtitle, CTAs)</div>
                <div>✓ Array de servicios ({services.length} items con iconos)</div>
                <div>✓ Formulario de captura y datos de contacto</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <FileText className="w-4 h-4 text-[#1d7eae]" />
                <span>📁 /Sitio_Web/Blog</span>
              </div>
              <p className="text-xs text-slate-400">
                Artículos generados en formato Markdown listos para renderizar:
              </p>
              <div className="text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-slate-300 space-y-1">
                {blogPosts.map((b, i) => (
                  <div key={i} className="truncate">✓ articulo_0{i+1}_{b.title.slice(0, 20).replace(/\s+/g, '_')}.md</div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Share2 className="w-4 h-4 text-[#1d7eae]" />
                <span>📁 /Redes_Sociales/{isApproved ? 'Publicado' : 'Para_Publicar'}</span>
              </div>
              <p className="text-xs text-slate-400">
                Estado: <span className={isApproved ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {isApproved ? 'Aprobado y sellado en histórico' : 'Borrador en bandeja de espera'}
                </span>
              </p>
              <div className="text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-slate-300">
                Payload formateado para webhook hacia Meta Graph API / Make.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Calendar className="w-4 h-4 text-[#1d7eae]" />
                <span>📁 /Calendario</span>
              </div>
              <p className="text-xs text-slate-400">
                Programación editorial automática registrada con fecha y hora.
              </p>
              <div className="text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-slate-300">
                Disparo agendado tras confirmación humana del auditor.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUBTAB 4: JSON & CÓDIGO EXPORTABLE */}
      {subTab === 'code' && (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-base font-bold text-white">Especificación JSON para Despliegue en Vercel</h4>
              <p className="text-xs text-slate-400">Payload modular consumible por componentes React y endpoints de Vercel.</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? '¡Copiado!' : 'Copiar JSON'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-[#98dae9] overflow-x-auto max-h-80 overflow-y-auto">
            {JSON.stringify(site, null, 2)}
          </pre>
        </div>
      )}

      {/* 6. PIE DE AUDITORÍA HUMANA & APROBACIÓN OBLIGATORIA */}
      <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-xs text-slate-400">
          Evaluador asignado: <strong className="text-white">{currentUser?.displayName || 'Auditor'}</strong> ({currentUser?.email})
        </div>

        {!isApproved ? (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onRegenerate}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            >
              🔄 Volver a Generar
            </button>
            <button
              onClick={onApprove}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aprobar Sitio Web & Certificar Publicación</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>Aprobado por {currentUser?.displayName || 'Auditor'} • Despliegue Habilitado</span>
          </div>
        )}
      </div>

    </div>
  );
}
