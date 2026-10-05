import { useState, useEffect } from 'react';

function App() {
  // Estados para el Cerebro Digital (IA)
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [approvedSuccess, setApprovedSuccess] = useState(false);

  // Estados para contenidos sincronizados
  const [publishedContent, setPublishedContent] = useState([]);

  // URL del Backend en Render (o local)
  const BACKEND_URL = 'https://myos-platform.onrender.com/api';

  // Cargar contenidos aprobados al iniciar
  useEffect(() => {
    fetch(`${BACKEND_URL}/content/`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPublishedContent(data);
        }
      })
      .catch((err) => console.log('Buscando contenidos del backend...', err));
  }, []);

  // 1. Solicitud a la IA
  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setLoading(true);
    setApprovedSuccess(false);

    try {
      const res = await fetch(`${BACKEND_URL}/generate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief })
      });
      const data = await res.json();
      if (res.ok) {
        setProposal(data);
      } else {
        alert(data.error || 'Error generando la propuesta con la IA');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor de la IA');
    } finally {
      setLoading(false);
    }
  };

  // 2. Aprobar Propuesta (Regla No Negociable: PENDING -> APPROVED)
  const handleApprove = async () => {
    if (!proposal) return;
    try {
      const res = await fetch(`${BACKEND_URL}/approve/${proposal.id}/`, {
        method: 'POST'
      });
      if (res.ok) {
        setApprovedSuccess(true);
        // Agregar a la lista visible de publicaciones de la web
        setPublishedContent([
          {
            id: proposal.id,
            title: proposal.content.titulo,
            body_text: proposal.content.resumen_web,
            category: 'PÁGINA WEB / REDES'
          },
          ...publishedContent
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#1d7eae] selection:text-white">
      
      {/* 1. Header & Navegación Institucional */}
      <header className="sticky top-0 z-50 bg-[#231f20]/90 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1d7eae] rounded-lg flex items-center justify-center font-extrabold text-white text-xl tracking-tighter shadow-lg shadow-[#1d7eae]/30">
              IOT
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block leading-none">
                IOT <span className="text-[#1d7eae]">TECHNOLOGIES</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">
                Business Innovation Solutions
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#inicio" className="hover:text-[#98dae9] transition">Inicio</a>
            <a href="#servicios" className="hover:text-[#98dae9] transition">Servicios</a>
            <a href="#cerebro-digital" className="hover:text-[#98dae9] transition flex items-center gap-1.5 text-[#1d7eae] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#1d7eae] animate-pulse"></span>
              Cerebro Digital IA
            </a>
            <a href="#publicaciones" className="hover:text-[#98dae9] transition">Sitio & Redes</a>
          </nav>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="inicio" className="relative pt-20 pb-16 px-6 bg-gradient-to-b from-[#231f20] via-slate-900 to-slate-950 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#1d7eae]/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1d7eae]/15 border border-[#1d7eae]/30 text-[#98dae9] text-xs font-semibold tracking-wide uppercase">
            Plataforma MYOS — Growth Operating System
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Soluciones en Innovación <br />
            <span className="bg-gradient-to-r from-[#98dae9] via-[#1d7eae] to-[#0032a0] bg-clip-text text-transparent">
              para su negocio
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-normal">
            Generación y actualización autónoma de sitios web de alta conversión y contenido para redes sociales mediante Inteligencia Artificial con aprobación humana centralizada.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <a
              href="#cerebro-digital"
              className="px-8 py-3.5 rounded-xl font-semibold text-white bg-[#1d7eae] hover:bg-[#0032a0] shadow-lg shadow-[#1d7eae]/25 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Probar Cerebro Digital
            </a>
            <a
              href="#servicios"
              className="px-8 py-3.5 rounded-xl font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
            >
              Ver Servicios Corporativos
            </a>
          </div>
        </div>
      </section>

      {/* 3. Servicios Corporativos */}
      <section id="servicios" className="py-20 px-6 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1d7eae]">Nuestras Capacidades</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white">Servicios en Innovación Tecnológica</h3>
          </div>

          <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
            {[
              { title: 'Inteligencia de Negocios', desc: 'Análisis de datos, métricas clave y tableros interactivos para la toma de decisiones estratégicas.' },
              { title: 'Dispositivos Conectados', desc: 'Integración IoT para monitoreo, automatización y recolección de información en tiempo real.' },
              { title: 'Servicios TIC', desc: 'Infraestructura tecnológica, gestión en la nube y soporte especializado para operaciones PyME y corporativas.' },
              { title: 'Desarrollo de Software', desc: 'Creación de plataformas web, APIs y aplicaciones móviles a la medida de alto rendimiento.' },
              { title: 'Kioskos Electrónicos', desc: 'Soluciones de hardware y software interactivo para atención autónoma al usuario final.' },
              { title: 'Presencia en Redes & Web', desc: 'Actualización constante de canales digitales impulsados por IA y respaldados por tu equipo.' },
            ].map((srv, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-[#231f20]/60 border border-slate-800 hover:border-[#1d7eae]/50 transition-all duration-200 group hover:-translate-y-1"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1d7eae]/10 text-[#98dae9] flex items-center justify-center font-bold mb-4 group-hover:bg-[#1d7eae] group-hover:text-white transition-colors">
                  0{index + 1}
                </div>
                <h4 className="text-xl font-bold text-white mb-2">{srv.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{srv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Módulo del Cerebro Digital (IA + Flujo de Aprobación) */}
      <section id="cerebro-digital" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-b from-slate-900 to-[#231f20] rounded-3xl border border-[#1d7eae]/40 p-8 sm:p-10 shadow-2xl space-y-8">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-xs font-bold text-[#98dae9] uppercase tracking-widest">Módulo de Asistencia</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
                🧠 Cerebro Digital (Generación con IA)
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#1d7eae]/20 border border-[#1d7eae]/40 text-[#98dae9] text-xs font-medium">
              Regla: Aprobación Humana Obligatoria
            </span>
          </div>

          {/* Formulario Prompt */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Instrucción / Brief para la IA (Página web o Redes Sociales):
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Ejemplo: Diseña una propuesta de publicación para promocionar soluciones de software e Inteligencia de Negocios para empresas locales..."
              className="w-full h-32 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1d7eae] text-sm leading-relaxed"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !brief.trim()}
              className="w-full py-4 rounded-xl font-bold text-white bg-[#1d7eae] hover:bg-[#0032a0] disabled:bg-slate-800 disabled:text-slate-600 transition shadow-lg shadow-[#1d7eae]/20"
            >
              {loading ? '🧠 Procesando sugerencia con Gemini IA...' : 'Generar Sugerencias (Texto + Imagen)'}
            </button>
          </div>

          {/* Tarjeta de Propuesta Generada (Estado PENDING) */}
          {proposal && (
            <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-slate-950 border border-blue-500/30 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  approvedSuccess 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}>
                  ESTADO: {approvedSuccess ? 'APPROVED (APROBADO)' : 'PENDING (PENDIENTE DE APROBACIÓN)'}
                </span>
                <span className="text-xs font-mono text-slate-500">ID: #{proposal.id}</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título Recomendado</h5>
                    <p className="text-lg font-bold text-white mt-1">{proposal.content.titulo}</p>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Propuesta para Landing Page</h5>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      {proposal.content.resumen_web}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Copy para Redes Sociales</h5>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 whitespace-pre-line font-mono text-xs">
                      {proposal.content.copy_redes}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#98dae9] uppercase tracking-wider">Arte / Prompt de Imagen Recomendado</h5>
                    <div className="p-3.5 rounded-xl bg-[#0032a0]/20 border border-[#1d7eae]/40 text-xs text-[#98dae9] font-mono mt-1">
                      🎨 {proposal.content.prompt_imagen}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Control Humano */}
              {!approvedSuccess ? (
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800">
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  >
                    🔄 Volver a generar (Descartar)
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex-1 py-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20"
                  >
                    ✅ Aprobar y Publicar
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-center font-semibold text-sm">
                  ✓ Propuesta aprobada por el usuario. Registrada y lista para sincronización.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 5. Muestrario de Publicaciones Aprobadas */}
      <section id="publicaciones" className="py-16 px-6 max-w-6xl mx-auto">
        <div className="space-y-8">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-2xl font-bold text-white">Contenidos Públicos Aprobados</h3>
            <p className="text-sm text-slate-400 mt-1">
              Contenidos que superaron el estado PENDING y cuentan con la validación para mostrarse en el sitio web[cite: 46].
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {publishedContent.length > 0 ? (
              publishedContent.map((item) => (
                <div key={item.id} className="p-6 rounded-2xl bg-[#231f20] border border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#1d7eae]/20 text-[#98dae9] border border-[#1d7eae]/30">
                    ESTADO: APPROVED
                  </span>
                  <h4 className="text-xl font-bold text-white">{item.title}</h4>
                  <p className="text-sm text-slate-300 line-clamp-3">{item.body_text}</p>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                Aún no hay publicaciones aprobadas visibles. Genera una propuesta arriba y presiona "Aprobar y Publicar".
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Footer Institucional */}
      <footer className="bg-[#231f20] border-t border-slate-800 py-12 px-6 text-slate-400 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div>
            <h4 className="text-lg font-bold text-white">IOT TECHNOLOGIES</h4>
            <p className="text-xs text-slate-500 mt-1">Soluciones en Innovación para su negocio</p>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 IOT Technologies — Desarrollado para Merkatics Growth Operating System (MYOS).
          </p>
        </div>
      </footer>

    </div>
  );
}

export default App;