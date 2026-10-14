import React, { useState } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  Calendar,
  UserCheck,
  Globe,
  Download,
  Edit3,
  Search,
  Sparkles,
  FolderTree,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export default function ApprovedWebsitesSection({
  approvedList = [],
  onOpenSiteInNewTab,
  onLoadInEditor,
  onDownloadHtml,
  onGoToGenerator,
  onViewDrive
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const filteredItems = approvedList.filter((item) => {
    const siteTitle = (item.title || item.content?.site_name || item.content?.titulo || '').toLowerCase();
    const approverName = (item.approved_by || '').toLowerCase();
    const approverEmail = (item.approved_by_email || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = siteTitle.includes(query) || approverName.includes(query) || approverEmail.includes(query);
    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const formatDate = (isoString) => {
    if (!isoString) return 'Fecha certificada reciente';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <section className="py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* 1. Encabezado de la Sección de Sitios Aprobados */}
      <div className="bg-gradient-to-r from-white via-white to-[#F8F9FC] border border-[#DFE3EC] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Registro Centralizado de Páginas Web & Apps Aprobadas</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#252B3A] font-heading">
              Sitios Web Aprobados y Certificados para Publicación
            </h2>
            <p className="text-xs sm:text-sm text-[#3A4256] mt-1 max-w-2xl leading-relaxed">
              Cumplimiento de la restricción de Carlos: Consulta aquí todos los sitios y aplicaciones que han sido revisados y validados por un evaluador humano, junto con la identidad de quién autorizó su publicación y la opción de abrirlos en una nueva pestaña.
            </p>
          </div>

          <button
            onClick={onGoToGenerator}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1d7eae] to-[#0032a0] hover:opacity-95 transition shadow-lg shadow-[#1d7eae]/20 flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-center"
          >
            <Sparkles className="w-4 h-4" />
            <span>Crear Nueva Página con IA</span>
          </button>
        </div>

        {/* Métricas del Sistema de Aprobación */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 relative z-10">
          <div className="p-3.5 rounded-2xl bg-white border border-[#DFE3EC] text-center">
            <span className="text-2xl font-black text-emerald-700 block">{approvedList.length}</span>
            <span className="text-[11px] text-[#5A6172] font-semibold uppercase tracking-wider">Sitios Aprobados</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#DFE3EC] text-center">
            <span className="text-2xl font-black text-white block">100%</span>
            <span className="text-[11px] text-[#5A6172] font-semibold uppercase tracking-wider">Firma Humana</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#DFE3EC] text-center">
            <span className="text-2xl font-black text-[#98dae9] block">Vercel & Drive</span>
            <span className="text-[11px] text-[#5A6172] font-semibold uppercase tracking-wider">Destino Despliegue</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#DFE3EC] text-center">
            <span className="text-2xl font-black text-emerald-300 block">Autónomos</span>
            <span className="text-[11px] text-[#5A6172] font-semibold uppercase tracking-wider">HTML5 + Tailwind</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de negocio, aprobador o correo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#DFE3EC] text-xs sm:text-sm text-[#252B3A] placeholder-[#737B8C] focus:outline-none focus:ring-2 focus:ring-[#1d7eae]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition border ${
              filterCategory === 'ALL'
                ? 'bg-[#1d7eae] text-white border-[#1d7eae]'
                : 'bg-white text-[#5A6172] border-[#DFE3EC] hover:text-[#252B3A]'
            }`}
          >
            Todos ({approvedList.length})
          </button>
          <button
            onClick={onViewDrive}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#F2F4FA] text-[#3A4256] border border-[#DFE3EC] transition flex items-center gap-1.5"
          >
            <FolderTree className="w-3.5 h-3.5 text-[#98dae9]" />
            <span>Google Drive CMS</span>
          </button>
        </div>
      </div>

      {/* 3. Listado / Grilla de Sitios Aprobados */}
      {filteredItems.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredItems.map((item) => {
            const content = item.content || {};
            const siteTitle = content.site_name || item.title || 'Sitio Web Aprobado';
            const tagline = content.tagline || content.resumen_web || item.body_text || 'Sitio web profesional';
            const primaryColor = content.brand_colors?.primary || '#1d7eae';
            const logo = content.custom_logo || null;
            const heroImage = content.hero_image || null;
            const approverName = item.approved_by || 'Carlos Torres (Evaluador)';
            const approverEmail = item.approved_by_email || 'carlos.torres@iottechnologies.mx';
            const approvedDate = formatDate(item.approved_at || item.created_at);

            return (
              <div
                key={item.id}
                className="rounded-3xl bg-white border border-[#DFE3EC] hover:border-emerald-500/40 transition shadow-xl overflow-hidden flex flex-col justify-between group"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      {logo ? (
                        <img
                          src={logo}
                          alt={siteTitle}
                          className="w-12 h-12 object-contain rounded-xl bg-white p-1 border border-[#DFE3EC] shadow-sm shrink-0"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {siteTitle.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>APPROVED</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#737B8C]">#{item.id}</span>
                        </div>
                        <h3 className="text-lg font-black text-[#252B3A] mt-1 group-hover:text-[#98dae9] transition leading-tight">
                          {siteTitle}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#3A4256] leading-relaxed line-clamp-2">
                    {tagline}
                  </p>

                  {/* Imagen de Portada / Previsualización */}
                  {heroImage ? (
                    <div className="rounded-xl overflow-hidden h-36 bg-[#F8F9FC] border border-[#DFE3EC] relative group/img">
                      <img
                        src={heroImage}
                        alt="Portada del sitio"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#252B3A]/70 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-[10px] font-mono text-white bg-[#252B3A]/80 px-2 py-0.5 rounded">
                          Vista previa del sitio web
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="rounded-xl p-4 bg-white border border-[#DFE3EC] flex items-center justify-between text-xs"
                      style={{ borderLeftColor: primaryColor, borderLeftWidth: '4px' }}
                    >
                      <div className="space-y-0.5">
                        <span className="text-[#252B3A] font-bold block">{content.hero?.title || siteTitle}</span>
                        <span className="text-[#5A6172] text-[11px] block">{content.industry || 'Servicios y Negocios'}</span>
                      </div>
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                        title={`Color primario: ${primaryColor}`}
                      ></span>
                    </div>
                  )}

                  {/* RECUADRO DE AUDITORÍA HUMANA: QUIÉN LO APROBÓ Y CUÁNDO */}
                  <div className="p-3.5 rounded-2xl bg-[#F8F9FC] border border-emerald-500/25 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                      <span>Certificado y Aprobado por:</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div>
                        <strong className="text-white block font-semibold">{approverName}</strong>
                        <span className="text-[#5A6172] text-[11px] font-mono block">{approverEmail}</span>
                      </div>
                      <div className="text-right text-[11px] text-[#5A6172] flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{approvedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción de la Tarjeta */}
                <div className="p-4 bg-[#F8F9FC] border-t border-[#DFE3EC] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {onLoadInEditor && (
                      <button
                        onClick={() => onLoadInEditor(item)}
                        title="Cargar este sitio en el generador para editar textos, fotos o pedirle a la IA"
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#F2F4FA] text-[#3A4256] border border-[#DFE3EC] transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#98dae9]" />
                        <span>Editar</span>
                      </button>
                    )}
                    {onDownloadHtml && (
                      <button
                        onClick={() => onDownloadHtml(item)}
                        title="Descargar index.html autónomo"
                        className="p-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#F2F4FA] text-[#3A4256] hover:text-[#252B3A] border border-[#DFE3EC] transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* BOTÓN PRINCIPAL: ABRIR EN OTRA PESTAÑA */}
                  <button
                    onClick={() => onOpenSiteInNewTab(item)}
                    className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 transition shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer"
                    title="Abre la página completa en una pestaña nueva de tu navegador"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir en otra pestaña</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-[#DFE3EC] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F2F4FA] text-[#5A6172] mx-auto flex items-center justify-center">
            <Globe className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-[#252B3A]">No se encontraron sitios aprobados con este criterio</h4>
            <p className="text-xs text-[#5A6172] max-w-md mx-auto">
              {searchTerm
                ? 'Prueba con otra palabra clave o limpia el filtro de búsqueda.'
                : 'Genera tu primer sitio web con el Cerebro Digital y haz clic en "Aprobar Sitio Web & Certificar Publicación" para que aparezca aquí.'}
            </p>
          </div>
          <button
            onClick={onGoToGenerator}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#1d7eae] hover:bg-[#1d7eae]/90 transition inline-flex items-center gap-2"
          >
            <span>Ir al Generador Web con IA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
