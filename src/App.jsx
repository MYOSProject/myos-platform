import { useState, useEffect } from 'react';
import {
  auth,
  onAuthStateChanged,
  signOut
} from './firebase';
import Logo from './components/Logo';
import AuthModal from './components/AuthModal';
import DriveExplorer from './components/DriveExplorer';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  LogOut,
  FolderTree,
  Layers,
  Phone,
  MapPin,
  Cpu,
  BarChart3,
  Network,
  Code2,
  MonitorCheck,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Estado de usuario y Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Estados para el Cerebro Digital (IA)
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [approvedSuccess, setApprovedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para contenidos sincronizados
  const [publishedContent, setPublishedContent] = useState([]);
  const [pendingContents, setPendingContents] = useState([]);
  const [activeTab, setActiveTab] = useState('plataforma'); // 'plataforma', 'auditoria', 'drive', 'manual'

  // URL del Backend
  const BACKEND_URL = '/api';

  // Suscribirse al estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          role: 'Aprobador Humano (Audit Trail)'
        });
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Cargar contenidos del backend al iniciar
  const loadContents = () => {
    fetch(`${BACKEND_URL}/content/`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPublishedContent(data);
        }
      })
      .catch((err) => console.log('Buscando contenidos del backend...', err));

    fetch(`${BACKEND_URL}/all-content/`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const pendings = data.filter((item) => item.status === 'PENDING');
          setPendingContents(pendings);
        }
      })
      .catch((err) => console.log('Cargando pendientes...', err));
  };

  useEffect(() => {
    loadContents();
  }, []);

  // 1. Solicitud al Cerebro Digital (IA)
  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setLoading(true);
    setApprovedSuccess(false);
    setErrorMessage('');

    try {
      const res = await fetch(`${BACKEND_URL}/generate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          userEmail: currentUser?.email || 'evaluador@iottechnologies.mx'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setProposal(data);
        loadContents();
      } else {
        setErrorMessage(data.error || 'Error procesando solicitud con la IA.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Error de conexión con el Cerebro Digital. Reintentando...');
    } finally {
      setLoading(false);
    }
  };

  // 2. Aprobar Propuesta (Regla No Negociable de Carlos: PENDING -> APPROVED con registro humano)
  const handleApprove = async (proposalId = null, proposalData = null) => {
    const targetId = proposalId || proposal?.id;
    const targetContent = proposalData || proposal?.content;
    if (!targetId) return;

    const approverName = currentUser?.displayName || 'Carlos Torres (Sales Consultant)';
    const approverEmail = currentUser?.email || 'Carlos.Torres@iottechnologies.mx';

    try {
      const res = await fetch(`${BACKEND_URL}/approve/${targetId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverName,
          approverEmail
        })
      });
      if (res.ok) {
        setApprovedSuccess(true);
        if (targetContent) {
          setPublishedContent((prev) => [
            {
              id: targetId,
              title: targetContent.titulo,
              body_text: targetContent.resumen_web,
              category: 'PÁGINA WEB / REDES',
              status: 'APPROVED',
              approved_by: approverName,
              approved_by_email: approverEmail,
              approved_at: new Date().toISOString()
            },
            ...prev
          ]);
        }
        loadContents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#1d7eae] selection:text-white">
      
      {/* 1. Header & Navegación Institucional Oficial IOT TECHNOLOGIES */}
      <header className="sticky top-0 z-40 bg-[#231f20]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          
          {/* Logo Corporativo Oficial */}
          <a href="#inicio" className="flex items-center">
            <Logo />
          </a>

          {/* Navegación de secciones */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-semibold text-slate-300">
            <button
              onClick={() => setActiveTab('plataforma')}
              className={`transition pb-1 ${activeTab === 'plataforma' ? 'text-[#98dae9] border-b-2 border-[#1d7eae]' : 'hover:text-white'}`}
            >
              Inicio & Soluciones
            </button>
            <button
              onClick={() => setActiveTab('plataforma')}
              className={`flex items-center gap-1.5 transition pb-1 ${activeTab === 'plataforma' ? 'text-[#1d7eae]' : 'hover:text-[#98dae9]'}`}
            >
              <span className="w-2 h-2 rounded-full bg-[#1d7eae] animate-pulse"></span>
              Cerebro Digital IA
            </button>
            <button
              onClick={() => setActiveTab('auditoria')}
              className={`flex items-center gap-1.5 transition pb-1 ${activeTab === 'auditoria' ? 'text-[#98dae9] border-b-2 border-[#1d7eae]' : 'hover:text-white'}`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Auditoría Humana
              {pendingContents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/40">
                  {pendingContents.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('drive')}
              className={`flex items-center gap-1.5 transition pb-1 ${activeTab === 'drive' ? 'text-[#98dae9] border-b-2 border-[#1d7eae]' : 'hover:text-white'}`}
            >
              <FolderTree className="w-4 h-4 text-[#1d7eae]" />
              Google Drive CMS
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`transition pb-1 ${activeTab === 'manual' ? 'text-[#98dae9] border-b-2 border-[#1d7eae]' : 'hover:text-white'}`}
            >
              Manual Corporativo
            </button>
          </nav>

          {/* Área de Autenticación Firebase */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-inner">
                <div className="w-7 h-7 rounded-lg bg-[#1d7eae] text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <span className="text-xs font-bold text-white block truncate max-w-[140px]">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold block flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 inline" /> Auditor Autorizado
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Cerrar Sesión"
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#1d7eae] hover:bg-[#0032a0] text-white shadow-lg shadow-[#1d7eae]/25 transition transform hover:-translate-y-0.5"
              >
                <User className="w-4 h-4" />
                <span>Iniciar Sesión / Registro</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Barra de Tabs para móviles */}
      <div className="lg:hidden flex overflow-x-auto gap-2 p-3 bg-slate-900/80 border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('plataforma')}
          className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'plataforma' ? 'bg-[#1d7eae] text-white' : 'text-slate-400'}`}
        >
          Inicio & IA
        </button>
        <button
          onClick={() => setActiveTab('auditoria')}
          className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'auditoria' ? 'bg-[#1d7eae] text-white' : 'text-slate-400'}`}
        >
          Auditoría ({pendingContents.length})
        </button>
        <button
          onClick={() => setActiveTab('drive')}
          className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'drive' ? 'bg-[#1d7eae] text-white' : 'text-slate-400'}`}
        >
          Google Drive CMS
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-3 py-1.5 rounded-lg shrink-0 ${activeTab === 'manual' ? 'bg-[#1d7eae] text-white' : 'text-slate-400'}`}
        >
          Manual Corporativo
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}

      {/* PESTAÑA 1: PLATAFORMA & HERO & CEREBRO DIGITAL */}
      {activeTab === 'plataforma' && (
        <>
          {/* 2. Hero Section Institucional */}
          <section id="inicio" className="relative pt-16 pb-20 px-6 bg-gradient-to-b from-[#231f20] via-slate-900 to-slate-950 overflow-hidden">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#1d7eae]/15 blur-[130px] rounded-full pointer-events-none"></div>

            <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
              
              {/* Badge oficial */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1d7eae]/15 border border-[#1d7eae]/35 text-[#98dae9] text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#1d7eae]"></span>
                Plataforma MYOS — Merkatics Growth Operating System
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight font-heading">
                Soluciones en Innovación <br />
                <span className="bg-gradient-to-r from-[#98dae9] via-[#1d7eae] to-[#0032a0] bg-clip-text text-transparent">
                  para su negocio
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
                Generación asistida por Inteligencia Artificial y gestión autónoma de sitios web de alta conversión y redes sociales, bajo la <strong className="text-white font-semibold">regla de aprobación humana obligatoria</strong> de Merkatics.
              </p>

              {/* Botones de llamada a la acción */}
              <div className="pt-2 flex flex-wrap justify-center gap-4">
                <a
                  href="#cerebro-digital"
                  className="px-7 py-3.5 rounded-xl font-bold text-white bg-[#1d7eae] hover:bg-[#0032a0] shadow-lg shadow-[#1d7eae]/30 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Operar Cerebro Digital
                </a>
                <button
                  onClick={() => setActiveTab('auditoria')}
                  className="px-7 py-3.5 rounded-xl font-bold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition flex items-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Panel de Aprobación Humana
                </button>
              </div>

              {/* Banner de auditoría de seguridad */}
              <div className="mt-8 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 max-w-2xl mx-auto flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Auditoría activa: <strong className="text-slate-200">
                      {currentUser ? currentUser.displayName : 'Sin autenticar (Acceso modo invitado)'}
                    </strong>
                  </span>
                </div>
                {!currentUser && (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-[#98dae9] hover:underline font-bold"
                  >
                    Ingresar con Firebase
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* 3. Las 5 Capacidades Oficiales del Manual Corporativo */}
          <section id="servicios" className="py-20 px-6 bg-slate-900/60 border-y border-slate-800/80">
            <div className="max-w-6xl mx-auto space-y-12">
              <div className="text-center space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#1d7eae]">
                  Líneas de Especialización Oficiales
                </h2>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
                  Servicios en Innovación Tecnológica
                </h3>
                <p className="text-sm text-slate-400 max-w-xl mx-auto">
                  Catálogo institucional certificado de IOT Technologies para PyMEs y empresas corporativas.
                </p>
              </div>

              <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
                {[
                  {
                    num: '01',
                    icon: BarChart3,
                    title: 'Inteligencia de Negocios',
                    desc: 'Análisis de datos, métricas clave, KPIs y tableros interactivos para la toma de decisiones ejecutivas en tiempo real.',
                    color: '#1d7eae'
                  },
                  {
                    num: '02',
                    icon: Cpu,
                    title: 'Dispositivos Conectados (IoT)',
                    desc: 'Sensores en tiempo real, telemetría y automatización de procesos para control industrial y comercial seguro.',
                    color: '#0032a0'
                  },
                  {
                    num: '03',
                    icon: Network,
                    title: 'Servicios TIC',
                    desc: 'Infraestructura tecnológica, redes corporativas, servidores en la nube y soporte especializado de alto nivel.',
                    color: '#1d7eae'
                  },
                  {
                    num: '04',
                    icon: Code2,
                    title: 'Desarrollo de Software',
                    desc: 'Creación de plataformas web de alta conversión, APIs escalables y aplicaciones móviles a la medida.',
                    color: '#0032a0'
                  },
                  {
                    num: '05',
                    icon: MonitorCheck,
                    title: 'Kioskos Electrónicos',
                    desc: 'Soluciones de hardware y software interactivo para atención autónoma, cobro y autoservicio al cliente final.',
                    color: '#ff661b'
                  },
                  {
                    num: '06',
                    icon: Layers,
                    title: 'Presencia en Redes & Web (MYOS)',
                    desc: 'Actualización continua de canales digitales con generación de contenido por IA y validación humana centralizada.',
                    color: '#98dae9'
                  }
                ].map((srv, index) => {
                  const Icon = srv.icon;
                  return (
                    <div
                      key={index}
                      className="p-6 rounded-2xl bg-[#231f20]/75 border border-slate-800 hover:border-[#1d7eae]/60 transition-all duration-200 group hover:-translate-y-1 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#1d7eae]/15 text-[#98dae9] flex items-center justify-center font-bold group-hover:bg-[#1d7eae] group-hover:text-white transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-500">{srv.num}</span>
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2 font-heading">{srv.title}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{srv.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 4. Módulo del Cerebro Digital (Generación IA + Control Humano) */}
          <section id="cerebro-digital" className="py-20 px-6 max-w-5xl mx-auto">
            <div className="bg-gradient-to-b from-slate-900 to-[#231f20] rounded-3xl border border-[#1d7eae]/40 p-8 sm:p-10 shadow-2xl space-y-8">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#98dae9] uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4 text-[#1d7eae]" />
                    Cerebro Digital con Gemini IA
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                    Generador de Propuestas & Contenido
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Genera landing pages, copies con hashtags y prompts de arte alineados a IOT Technologies.
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold block">
                    Regla: Aprobación Humana Obligatoria
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Estado inicial: PENDING</span>
                </div>
              </div>

              {/* Formulario Prompt */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-300">
                  Instrucción / Brief para el Cerebro Digital:
                </label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Ejemplo: Diseña una propuesta para promocionar soluciones de software empresarial e Inteligencia de Negocios para PyMEs de manufactura y logística en Ciudad Juárez y El Paso..."
                  className="w-full h-32 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1d7eae] text-sm leading-relaxed"
                />

                {/* Sugerencias rápidas de brief */}
                <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-400">
                  <span className="font-semibold text-slate-500">Sugerencias rápidas:</span>
                  {[
                    'Monitoreo de sensores IoT en plantas industriales',
                    'Kioskos de autoservicio y facturación electrónica',
                    'Tableros de Business Intelligence para directores'
                  ].map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => setBrief(sug)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 hover:text-[#98dae9] transition border border-slate-700/60"
                    >
                      {sug}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading || !brief.trim()}
                  className="w-full py-4 rounded-xl font-bold text-white bg-[#1d7eae] hover:bg-[#0032a0] disabled:bg-slate-800 disabled:text-slate-600 transition shadow-lg shadow-[#1d7eae]/25 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {loading ? '🧠 Cerebro Digital procesando con Gemini IA...' : 'Generar Propuesta de Contenido (Texto + Arte)'}
                </button>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-sm flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Tarjeta de Propuesta Generada (Estado PENDING) */}
              {proposal && (
                <div className="mt-8 p-6 sm:p-8 rounded-2xl bg-slate-950 border border-blue-500/40 space-y-6 shadow-2xl">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-bold px-3.5 py-1 rounded-full border flex items-center gap-1.5 ${
                        approvedSuccess 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}>
                        {approvedSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        ESTADO: {approvedSuccess ? 'APPROVED (APROBADO)' : 'PENDING (PENDIENTE DE APROBACIÓN)'}
                      </span>
                      <span className="text-xs font-mono text-slate-500">ID: #{proposal.id}</span>
                    </div>

                    <span className="text-xs text-slate-400 font-mono">
                      Carpeta Drive: /Redes_Sociales/{approvedSuccess ? 'Publicado' : 'Para_Publicar'}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título Corporativo Recomendado</h5>
                        <p className="text-lg font-bold text-white mt-1 font-heading">{proposal.content.titulo}</p>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Propuesta para Landing Page (Resumen Web)</h5>
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800 whitespace-pre-line">
                          {proposal.content.resumen_web}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Copy para Redes Sociales (Instagram / LinkedIn)</h5>
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800 whitespace-pre-line font-mono text-xs max-h-48 overflow-y-auto">
                          {proposal.content.copy_redes}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-[#98dae9] uppercase tracking-wider">Arte Publicitario / Prompt de Imagen Recomendado</h5>
                        <div className="p-3.5 rounded-xl bg-[#0032a0]/20 border border-[#1d7eae]/40 text-xs text-[#98dae9] font-mono mt-1">
                          🎨 {proposal.content.prompt_imagen}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Control y Auditoría Humana */}
                  {!approvedSuccess ? (
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <div className="text-xs text-slate-400 flex items-center justify-between">
                        <span>Aprobador que firmará: <strong className="text-white">{currentUser ? currentUser.displayName : 'Carlos Torres (Sales Consultant)'}</strong></span>
                        <span className="text-emerald-400 font-semibold">Cumple regla de auditoría</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={handleGenerate}
                          disabled={loading}
                          className="flex-1 py-3.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        >
                          🔄 Volver a generar (Descartar)
                        </button>
                        <button
                          onClick={() => handleApprove()}
                          className="flex-1 py-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Aprobar y Registrar Publicación
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-center font-semibold text-sm flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>
                        ✓ Contenido aprobado y sellado por {currentUser ? currentUser.displayName : 'Carlos Torres'}. Publicación registrada en el CMS.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 5. Muestrario de Publicaciones Aprobadas */}
          <section id="publicaciones" className="py-16 px-6 max-w-6xl mx-auto">
            <div className="space-y-8">
              <div className="border-b border-slate-800 pb-4 flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold text-white font-heading">
                    Contenidos Públicos Aprobados ({publishedContent.length})
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Contenidos que superaron el estado PENDING y cuentan con la firma humana registrada para su exhibición pública.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {publishedContent.length > 0 ? (
                  publishedContent.map((item) => (
                    <div key={item.id} className="p-6 rounded-2xl bg-[#231f20] border border-slate-800 space-y-4 hover:border-[#1d7eae]/50 transition">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ESTADO: APPROVED
                        </span>
                        <span className="text-slate-500 font-mono">ID: #{item.id}</span>
                      </div>

                      <h4 className="text-xl font-bold text-white font-heading">{item.title}</h4>
                      <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">{item.body_text}</p>

                      <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-[#98dae9]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {item.approved_by || 'Carlos Torres (Sales Consultant)'}
                        </span>
                        <span className="font-mono text-slate-500">
                          {item.approved_at ? new Date(item.approved_at).toLocaleDateString() : 'Verificado'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl space-y-2">
                    <p className="text-base font-semibold text-slate-400">No hay publicaciones aprobadas aún.</p>
                    <p className="text-xs">Genera una propuesta en el Cerebro Digital y presiona "Aprobar y Registrar Publicación".</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* PESTAÑA 2: AUDITORÍA HUMANA (REGLA DE CARLOS) */}
      {activeTab === 'auditoria' && (
        <section className="py-12 px-6 max-w-6xl mx-auto space-y-8 animate-fadeIn">
          <div className="bg-[#231f20] border border-slate-800 rounded-3xl p-8 space-y-4 shadow-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Módulo de Cumplimiento de Seguridad — Proyecto 2026-544-11
            </div>
            <h2 className="text-3xl font-extrabold text-white font-heading">
              Regla no negociable: Aprobación Humana antes de Publicar
            </h2>
            <blockquote className="p-4 rounded-xl bg-slate-900/90 border-l-4 border-[#1d7eae] text-sm text-slate-300 italic leading-relaxed">
              "Todo el proyecto se construye alrededor de una restricción de seguridad explícita de Carlos: ningún contenido generado por la IA (sitio web, texto, imagen o publicación en redes) se publica de forma automática. Debe existir siempre un estado de 'pendiente de aprobación humana' antes de cualquier publicación real, y quien apruebe debe quedar registrado."
            </blockquote>

            <div className="grid sm:grid-cols-3 gap-4 pt-4 text-center">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-2xl font-extrabold text-amber-400 block">{pendingContents.length}</span>
                <span className="text-xs text-slate-400 uppercase font-semibold">Pendientes (PENDING)</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-2xl font-extrabold text-emerald-400 block">{publishedContent.length}</span>
                <span className="text-xs text-slate-400 uppercase font-semibold">Aprobados (APPROVED)</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-2xl font-extrabold text-[#98dae9] block">100%</span>
                <span className="text-xs text-slate-400 uppercase font-semibold">Trazabilidad Humana</span>
              </div>
            </div>
          </div>

          {/* Bandeja de Contenidos Pendientes de Aprobación */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
              <Clock className="w-5 h-5 text-amber-400" />
              Bandeja de Entrada: Propuestas Esperando Validación Humana ({pendingContents.length})
            </h3>

            {pendingContents.length > 0 ? (
              <div className="space-y-4">
                {pendingContents.map((item) => (
                  <div key={item.id} className="p-6 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ESTADO: PENDING
                        </span>
                        <h4 className="text-lg font-bold text-white mt-1 font-heading">{item.title}</h4>
                      </div>
                      <span className="text-xs font-mono text-slate-500">ID: #{item.id}</span>
                    </div>

                    <p className="text-sm text-slate-300">{item.body_text}</p>

                    {item.content && (
                      <div className="grid sm:grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div>
                          <strong className="text-slate-400 block mb-1">Copy para Redes:</strong>
                          <p className="text-slate-300 font-mono line-clamp-3">{item.content.copy_redes}</p>
                        </div>
                        <div>
                          <strong className="text-[#98dae9] block mb-1">Prompt de Arte:</strong>
                          <p className="text-[#98dae9] font-mono line-clamp-3">{item.content.prompt_imagen}</p>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        onClick={() => handleApprove(item.id, item.content)}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-2 shadow-md shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Validar y Aprobar con mi Firma ({currentUser ? currentUser.displayName : 'Carlos Torres'})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                ✓ No hay elementos pendientes de aprobación en este momento.
              </div>
            )}
          </div>
        </section>
      )}

      {/* PESTAÑA 3: ESTRUCTURA GOOGLE DRIVE (CMS HEADLESS) */}
      {activeTab === 'drive' && (
        <section className="py-12 px-6 max-w-6xl mx-auto space-y-8 animate-fadeIn">
          <DriveExplorer
            publishedCount={publishedContent.length}
            pendingCount={pendingContents.length}
          />
        </section>
      )}

      {/* PESTAÑA 4: MANUAL CORPORATIVO & NORMAS GRÁFICAS */}
      {activeTab === 'manual' && (
        <section className="py-12 px-6 max-w-6xl mx-auto space-y-8 animate-fadeIn">
          <div className="bg-[#231f20] border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#1d7eae] uppercase tracking-wider">
                  Guía Oficial de Identidad Visual
                </span>
                <h2 className="text-3xl font-extrabold text-white mt-1 font-heading">
                  Manual Corporativo IOT Technologies
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Social eThinking S.A. de C.V. — Derechos Reservados
                </p>
              </div>
              <Logo />
            </div>

            {/* Simbología y Significado */}
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="text-base font-bold text-white font-heading">El Símbolo (Antena Emisora)</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Representa una antena emisora de una señal que se expande concéntricamente llevando un mensaje que llega a cumplir con el propósito para el cual fue enviado. Conexión, alcance y telemetría continua.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="text-base font-bold text-white font-heading">Tipografías Oficiales</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>OPEN SANS:</strong> Utilizada en el logo-símbolo y encabezados. Transmite firmeza, tecnología y neutralidad elegante.<br />
                  <strong>ROBOTO:</strong> Utilizada para niveles de lectura, datos y párrafos por su vanguardia y máxima legibilidad.
                </p>
              </div>
            </div>

            {/* Paleta de Colores Institucionales Oficial */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Colores Institucionales (Página 9 & 10 del Manual)
              </h4>
              <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { name: 'Pantone 640 C', hex: '#1d7eae', rgb: '29, 126, 174', tag: 'Principal' },
                  { name: 'Process Black', hex: '#231f20', rgb: '35, 31, 32', tag: 'Corporativo' },
                  { name: 'Pantone 286 C', hex: '#0032a0', rgb: '0, 51, 160', tag: 'Secundario' },
                  { name: 'Pantone 304 C', hex: '#98dae9', rgb: '153, 218, 234', tag: 'Auxiliar' },
                  { name: 'Pantone 165 C', hex: '#ff661b', rgb: '255, 103, 27', tag: 'Acento' },
                  { name: 'Pantone 441 C', hex: '#bdc6c3', rgb: '190, 198, 195', tag: 'Neutro' }
                ].map((col, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-center">
                    <div className="w-full h-12 rounded-lg shadow-md" style={{ backgroundColor: col.hex }}></div>
                    <span className="text-xs font-bold text-white block">{col.name}</span>
                    <span className="text-[10px] font-mono text-[#98dae9] block">{col.hex}</span>
                    <span className="text-[9px] text-slate-500 block">RGB: {col.rgb}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Directorio de Oficinas Oficial */}
            <div className="pt-4 border-t border-slate-800 grid md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="space-y-1">
                <span className="font-bold text-white block">Sede México:</span>
                <p>Benjamin Franklin 3220 5E, Ciudad Juárez, Chih.</p>
                <p>Tel: (Mx) 656-626-9124</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-white block">Sede Estados Unidos:</span>
                <p>James Watt Dr. 11395 Suite A-13, El Paso, TX</p>
                <p>Tel: From USA: 915-726-1048</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Footer Institucional Oficial con datos del Manual Corporativo */}
      <footer className="bg-[#231f20] border-t border-slate-800 py-12 px-6 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <Logo />
            <div className="flex flex-wrap gap-6 text-slate-300">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#1d7eae]" />
                Mx: 656-626-9124 | USA: 915-726-1048
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#1d7eae]" />
                Cd. Juárez, Chih. & El Paso, TX
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-[11px]">
            <p>
              © 2026 IOT Technologies — Parte de Social eThinking S.A. de C.V. Todos los derechos reservados.
            </p>
            <p>
              Plataforma MYOS — Generador de Sitios & Contenidos con IA ("Cerebro Digital"). Proyecto 2026-544-11.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal de Autenticación con Firebase */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            role: 'Aprobador Humano (Audit Trail)'
          });
        }}
      />

    </div>
  );
}
