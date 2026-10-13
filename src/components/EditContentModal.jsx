import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Trash2,
  Check,
  Image,
  Type,
  Briefcase,
  Users,
  Phone
} from 'lucide-react';

export default function EditContentModal({
  siteData,
  isOpen,
  onClose,
  onSave
}) {
  const [activeTab, setActiveTab] = useState('hero'); // 'hero', 'services', 'about', 'contact'
  
  // Estado local para los textos
  const [siteName, setSiteName] = useState(siteData?.site_name || siteData?.titulo || '');
  const [tagline, setTagline] = useState(siteData?.tagline || '');
  
  // Hero
  const [heroBadge, setHeroBadge] = useState(siteData?.hero?.badge || '');
  const [heroTitle, setHeroTitle] = useState(siteData?.hero?.title || '');
  const [heroSubtitle, setHeroSubtitle] = useState(siteData?.hero?.subtitle || '');
  const [heroCta, setHeroCta] = useState(siteData?.hero?.primary_cta || '');
  const [heroSecondaryCta, setHeroSecondaryCta] = useState(siteData?.hero?.secondary_cta || '');
  const [heroImage, setHeroImage] = useState(siteData?.hero_image || '');

  // Servicios
  const [services, setServices] = useState(
    siteData?.services || [
      { title: 'Servicio 1', description: 'Descripción', icon: 'Sparkles', badge: 'Popular', image: '' },
      { title: 'Servicio 2', description: 'Descripción', icon: 'ShieldCheck', badge: '', image: '' },
      { title: 'Servicio 3', description: 'Descripción', icon: 'TrendingUp', badge: '', image: '' }
    ]
  );

  // Nosotros
  const [aboutTitle, setAboutTitle] = useState(siteData?.about?.title || 'Nuestra Historia');
  const [aboutContent, setAboutContent] = useState(siteData?.about?.content || '');
  const [aboutImage, setAboutImage] = useState(siteData?.about?.image || '');

  // Contacto
  const [contactPhone, setContactPhone] = useState(siteData?.contact?.phone || '');
  const [contactEmail, setContactEmail] = useState(siteData?.contact?.email || '');
  const [contactAddress, setContactAddress] = useState(siteData?.contact?.address || '');

  const heroFileInputRef = useRef(null);
  const aboutFileInputRef = useRef(null);

  // Sincronizar estado cuando se abra el modal o cambie siteData
  useEffect(() => {
    if (siteData) {
      setSiteName(siteData.site_name || siteData.titulo || '');
      setTagline(siteData.tagline || '');
      setHeroBadge(siteData.hero?.badge || '');
      setHeroTitle(siteData.hero?.title || '');
      setHeroSubtitle(siteData.hero?.subtitle || '');
      setHeroCta(siteData.hero?.primary_cta || '');
      setHeroSecondaryCta(siteData.hero?.secondary_cta || '');
      setHeroImage(siteData.hero_image || '');
      setServices(
        siteData.services || [
          { title: 'Servicio 1', description: 'Descripción', icon: 'Sparkles', badge: 'Popular', image: '' },
          { title: 'Servicio 2', description: 'Descripción', icon: 'ShieldCheck', badge: '', image: '' },
          { title: 'Servicio 3', description: 'Descripción', icon: 'TrendingUp', badge: '', image: '' }
        ]
      );
      setAboutTitle(siteData.about?.title || 'Nuestra Historia');
      setAboutContent(siteData.about?.content || '');
      setAboutImage(siteData.about?.image || '');
      setContactPhone(siteData.contact?.phone || '');
      setContactEmail(siteData.contact?.email || '');
      setContactAddress(siteData.contact?.address || '');
    }
  }, [siteData, isOpen]);

  // Subir imagen para Hero
  const handleHeroImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setHeroImage(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  // Subir imagen para Nosotros
  const handleAboutImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAboutImage(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  // Subir imagen para servicio específico
  const handleServiceImageUpload = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const updated = [...services];
      updated[index] = { ...updated[index], image: event.target?.result };
      setServices(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updatedSite = {
      ...siteData,
      site_name: siteName,
      titulo: siteName,
      tagline,
      hero_image: heroImage,
      hero: {
        ...siteData.hero,
        badge: heroBadge,
        title: heroTitle,
        subtitle: heroSubtitle,
        primary_cta: heroCta,
        secondary_cta: heroSecondaryCta
      },
      services,
      about: {
        ...siteData.about,
        title: aboutTitle,
        content: aboutContent,
        image: aboutImage
      },
      contact: {
        ...siteData.contact,
        phone: contactPhone,
        email: contactEmail,
        address: contactAddress
      }
    };

    onSave(updatedSite);
    onClose();
  };

  if (!isOpen || !siteData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#231f20]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1d7eae]/20 text-[#98dae9] flex items-center justify-center font-bold">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base leading-tight">
                Editar Textos y Fotos de la Página
              </h3>
              <p className="text-[11px] text-slate-400">
                Personaliza manualmente cualquier título, párrafo o sube tus propias imágenes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Edición */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'hero', label: 'Portada & Textos', icon: Type },
            { id: 'photos', label: 'Fotos e Imágenes', icon: Image },
            { id: 'services', label: 'Servicios', icon: Briefcase },
            { id: 'about', label: 'Sobre Nosotros', icon: Users },
            { id: 'contact', label: 'Contacto', icon: Phone }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#1d7eae] text-white font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido Desplazable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          
          {/* TAB 1: PORTADA & TEXTOS */}
          {activeTab === 'hero' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200">Nombre de la Empresa o Marca:</label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200">Eslogan o Giro Comercial:</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Distintivo Superior (Badge):</label>
                <input
                  type="text"
                  value={heroBadge}
                  onChange={(e) => setHeroBadge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                  placeholder="Ej: ✨ Calidad Garantizada & Atención Inmediata"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Título Principal (Hero Title):</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Subtítulo / Descripción de Portada:</label>
                <textarea
                  rows={3}
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200">Texto Botón Principal (CTA):</label>
                  <input
                    type="text"
                    value={heroCta}
                    onChange={(e) => setHeroCta(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200">Texto Botón Secundario:</label>
                  <input
                    type="text"
                    value={heroSecondaryCta}
                    onChange={(e) => setHeroSecondaryCta(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FOTOS E IMÁGENES */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              {/* Foto de Portada (Hero) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-white flex items-center gap-2">
                    <Image className="w-4 h-4 text-[#98dae9]" />
                    <span>Foto Principal de Portada (Hero)</span>
                  </label>
                  {heroImage && (
                    <button
                      onClick={() => setHeroImage('')}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar Foto</span>
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={heroFileInputRef}
                  onChange={handleHeroImageUpload}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />

                {heroImage ? (
                  <div className="relative rounded-xl overflow-hidden h-44 border border-slate-700 group">
                    <img src={heroImage} alt="Portada" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        onClick={() => heroFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-[#1d7eae] text-white font-bold text-xs cursor-pointer"
                      >
                        Cambiar Imagen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => heroFileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-slate-800 hover:border-[#1d7eae] rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-900/50 hover:bg-slate-900 transition cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-[#98dae9]" />
                    <span className="font-bold text-white">Haz clic para subir una foto para tu portada</span>
                    <span className="text-[11px] text-slate-500">Admite JPG, PNG o WebP desde tu computadora</span>
                  </button>
                )}
              </div>

              {/* Foto de Quiénes Somos / Empresa */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#98dae9]" />
                    <span>Foto de la Empresa / Nosotros</span>
                  </label>
                  {aboutImage && (
                    <button
                      onClick={() => setAboutImage('')}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar Foto</span>
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={aboutFileInputRef}
                  onChange={handleAboutImageUpload}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />

                {aboutImage ? (
                  <div className="relative rounded-xl overflow-hidden h-36 border border-slate-700 group">
                    <img src={aboutImage} alt="Nosotros" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        onClick={() => aboutFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-[#1d7eae] text-white font-bold text-xs cursor-pointer"
                      >
                        Cambiar Imagen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => aboutFileInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-slate-800 hover:border-[#1d7eae] rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-900/50 hover:bg-slate-900 transition cursor-pointer"
                  >
                    <Upload className="w-5 h-5 text-[#98dae9]" />
                    <span className="font-bold text-white">Subir foto de tu local, negocio o equipo</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SERVICIOS */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <span className="text-slate-400 block mb-2">
                Personaliza los servicios o productos destacados de tu página web:
              </span>
              {services.map((srv, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-xs uppercase tracking-wider text-[#98dae9]">
                      Servicio {idx + 1}
                    </span>
                    {srv.image && (
                      <button
                        onClick={() => {
                          const updated = [...services];
                          updated[idx] = { ...updated[idx], image: '' };
                          setServices(updated);
                        }}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Título del Servicio:</label>
                      <input
                        type="text"
                        value={srv.title}
                        onChange={(e) => {
                          const updated = [...services];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setServices(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Distintivo (Badge opcional):</label>
                      <input
                        type="text"
                        value={srv.badge || ''}
                        onChange={(e) => {
                          const updated = [...services];
                          updated[idx] = { ...updated[idx], badge: e.target.value };
                          setServices(updated);
                        }}
                        placeholder="Ej: Destacado, Oferta, Popular"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Descripción detallada:</label>
                    <textarea
                      rows={2}
                      value={srv.description}
                      onChange={(e) => {
                        const updated = [...services];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setServices(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <label className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white cursor-pointer inline-flex items-center gap-1.5 text-[11px]">
                      <Upload className="w-3 h-3 text-[#98dae9]" />
                      <span>{srv.image ? 'Cambiar foto de este servicio' : 'Subir foto para este servicio'}</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={(e) => handleServiceImageUpload(idx, e)}
                        className="hidden"
                      />
                    </label>
                    {srv.image && (
                      <img src={srv.image} alt={srv.title} className="w-8 h-8 rounded object-cover border border-slate-700" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: SOBRE NOSOTROS */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Título de la Sección:</label>
                <input
                  type="text"
                  value={aboutTitle}
                  onChange={(e) => setAboutTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Historia / Propuesta de Valor:</label>
                <textarea
                  rows={6}
                  value={aboutContent}
                  onChange={(e) => setAboutContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                />
              </div>
            </div>
          )}

          {/* TAB 5: CONTACTO */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Teléfono / WhatsApp:</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Correo Electrónico:</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200">Dirección o Cobertura:</label>
                <input
                  type="text"
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-[#1d7eae]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal con Guardar Cambios */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#231f20] flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Cambios y Actualizar Sitio</span>
          </button>
        </div>

      </div>
    </div>
  );
}
