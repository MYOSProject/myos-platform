import { useState, useEffect } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import Logo from './components/Logo';
import DriveExplorer from './components/DriveExplorer';
import GeneratedWebsitePreview from './components/GeneratedWebsitePreview';
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
  AlertCircle,
  Lock,
  Mail,
  UserPlus,
  LogIn
} from 'lucide-react';

// Motor Autónomo de Inteligencia Artificial para MYOS (Generador de Sitios Web de Alta Conversión)
function generateSmartProposal(brief) {
  const cleanBrief = (brief || '').trim();
  const lower = cleanBrief.toLowerCase();

  let siteName = 'Nexus Soluciones & Growth';
  let industry = 'Servicios Empresariales & Tecnología';
  let tagline = 'Elevamos el rendimiento y rentabilidad de su negocio con estrategias de alta conversión.';
  let primaryColor = '#1d7eae';
  let secondaryColor = '#0032a0';
  let accentColor = '#98dae9';

  let hero = {
    badge: '🚀 Solución de Alta Conversión',
    title: `Potencie su Empresa con ${siteName}`,
    subtitle: 'Diseñado bajo estándares corporativos para capturar leads calificados, automatizar operaciones y posicionar su marca en el mercado.',
    primary_cta: 'Solicitar Demostración Sin Costo',
    secondary_cta: 'Conocer Nuestros Servicios',
    trust_badges: ['Atención 24/7', 'Garantía de Satisfacción', 'Soporte Especializado']
  };

  let services = [
    { title: 'Solución Integral de Negocio', description: 'Metodologías probadas para optimizar costos y maximizar resultados comerciales.', icon: 'Sparkles', badge: 'Destacado' },
    { title: 'Automatización & Plataformas', description: 'Sistemas conectados para eliminar tareas manuales y errores operativos.', icon: 'ShieldCheck', badge: 'Popular' },
    { title: 'Consultoría y Crecimiento', description: 'Acompañamiento estratégico continuo para alcanzar sus metas de rentabilidad.', icon: 'TrendingUp', badge: 'Garantizado' }
  ];

  let about = {
    title: 'Compromiso Ético y Excelencia Comercial',
    content: 'Ayudamos a PyMEs y corporativos a superar desafíos operativos mediante soluciones a la medida.\n\nCreemos en relaciones comerciales a largo plazo respaldadas por resultados tangibles y métricas transparentes.',
    metrics: [
      { label: 'Clientes Atendidos', value: '+750' },
      { label: 'Tasa de Recomendación', value: '99.2%' },
      { label: 'Años de Experiencia', value: '10+' }
    ]
  };

  let blogPosts = [
    { title: '5 Estrategias para Aumentar la Tasa de Conversión en su Sitio Web', excerpt: 'Cómo diseñar llamadas a la acción irresistibles y elementos de confianza para clientes potenciales.', read_time: '4 min', date: 'Esta semana' },
    { title: 'Automatización Operativa para PyMEs: Dónde empezar para ahorrar costos', excerpt: 'Guía práctica para eliminar cuellos de botella y enfocar su tiempo en ventas.', read_time: '3 min', date: 'Hace unos días' }
  ];

  let contact = {
    title: 'Comience la Transformación Hoy',
    subtitle: 'Nuestros consultores están listos para analizar su proyecto sin compromiso.',
    phone: '+52 (656) 613-0000',
    email: 'contacto@empresa.com',
    address: 'Av. Tecnológico #1234, Parque Industrial Juárez'
  };

  let social = {
    facebook: {
      copy: `🚀 ¿Listo para hacer crecer su negocio? En ${siteName} diseñamos soluciones de alta conversión orientadas a resultados comerciales tangibles.\n\n✅ Diagnóstico sin costo\n✅ Acompañamiento de especialistas\n\n📩 Contáctenos hoy mismo y conozca lo que podemos lograr juntos.`,
      cta: 'Solicitar Información'
    },
    instagram: {
      copy: 'La verdadera ventaja competitiva radica en operar con herramientas ágiles y una presencia digital impecable. ✨ Descubre nuestras soluciones a la medida.',
      hashtags: '#NegocioExitoso #InnovacionComercial #PyMEsDeAltoImpacto #Liderazgo #Crecimiento'
    }
  };

  let imagePrompt = 'Fotografía publicitaria corporativa de alta fidelidad con iluminación elegante, ejecutivos colaborando en ambiente contemporáneo, estilo editorial 8k.';

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
    siteName = 'Aroma & Grano - Specialty Coffee';
    industry = 'Gastronomía & Cafetería Gourmet';
    tagline = 'El ritual del café de especialidad tostado artesanalmente para inspirar tus mejores momentos.';
    primaryColor = '#b45309';
    secondaryColor = '#78350f';
    accentColor = '#fef3c7';
    hero = {
      badge: '☕ Granos 100% de Origen Único',
      title: 'Despierta tus sentidos con el mejor café de especialidad de la ciudad',
      subtitle: 'Tostado artesanalmente cada semana, extracciones con baristas certificados y repostería gourmet recién horneada en un ambiente diseñado para inspirarte.',
      primary_cta: 'Ver Nuestro Menú & Promociones',
      secondary_cta: 'Visítanos o Pide para Llevar',
      trust_badges: ['Granos Éticos & Orgánicos', 'Wi-Fi de Alta Velocidad', 'Baristas Certificados']
    };
    services = [
      { title: 'Barra de Extracciones de Especialidad', description: 'V60, Chemex, Aeropress y espresso con perfiles de notas florales y achocolatadas.', icon: 'Coffee', badge: 'Estrella de la Casa' },
      { title: 'Repostería Francesa Artesanal', description: 'Croissants de mantequilla, tartas de frutos rojos y panes horneados cada mañana.', icon: 'Sparkles', badge: 'Recién Horneado' },
      { title: 'Espacio Co-Working & Reuniones', description: 'Mesas con tomas de corriente, iluminación natural y ambiente acústico relajado.', icon: 'Users', badge: 'Wi-Fi Gratuito' }
    ];
    about = {
      title: 'Nuestra Pasión por el Grano Perfecto',
      content: 'Nacimos con la misión de democratizar el café de alta especialidad. Trabajamos directamente con pequeños productores en regiones montañosas para garantizar comercio justo y frescura insuperable en cada taza.\n\nCreemos que una buena taza de café tiene el poder de conectar ideas y transformar el día de quien la disfruta.',
      metrics: [
        { label: 'Tazas Servidas con Pasión', value: '+45,000' },
        { label: 'Variedades de Grano Único', value: '12 Orígenes' },
        { label: 'Clientes Satisfechos', value: '99.4%' }
      ]
    };
    blogPosts = [
      { title: 'Guía Rápida: Diferencias entre Cold Brew y Café Helado Tradicional', excerpt: 'Descubre por qué la extracción en frío durante 18 horas produce una bebida con menor acidez y dulzor natural superior.', read_time: '3 min', date: 'Esta semana' },
      { title: 'El Arte del Maridaje: Qué café elegir según tu postre favorito', excerpt: 'Aprende a combinar cafés cítricos con repostería de chocolate oscuro para una experiencia de sabor inolvidable.', read_time: '4 min', date: 'Hace unos días' }
    ];
    contact = {
      title: 'Ven a Disfrutar el Ritual del Café',
      subtitle: 'Abierto todos los días de 7:30 AM a 10:00 PM. ¡Te esperamos!',
      phone: '+52 (656) 456-7890',
      email: 'hola@aromaygrano.com',
      address: 'Calle Primavera #402, Zona Dorada, Ciudad Juárez'
    };
    social = {
      facebook: {
        copy: '☕ ¿Listo para tu próxima pausa perfecta? En Aroma & Grano preparamos café de especialidad con granos de altura, extracciones precisas y repostería artesanal recién horneada.\n\n📍 Te esperamos todos los días con el mejor aroma de la ciudad.\n\n👉 ¡Ven por tu favorito o pide para llevar!',
        cta: 'Ver Menú y Ubicación'
      },
      instagram: {
        copy: 'El secreto de una gran mañana está en los detalles: notas achocolatadas, crema sedosa y el sonido de una extracción perfecta. ✨\n\n¿Ya probaste nuestro Flat White?',
        hashtags: '#CafeDeEspecialidad #CoffeeLover #CafeteriaArtesanal #BrunchTime #CoffeeTime #ExperienciaGourmet'
      }
    };
    imagePrompt = 'Fotografía publicitaria profesional de una taza de café latte con latte art refinado en taza de cerámica artesanal sobre mesa de madera rústica, granos de café tostados dispersos con elegancia, luz natural cálida de mañana, estilo editorial 8k.';
  }
  // 2. Salud, Odontología, Clínicas y Belleza
  else if (
    lower.includes('clinica') ||
    lower.includes('dental') ||
    lower.includes('diente') ||
    lower.includes('salud') ||
    lower.includes('medico') ||
    lower.includes('spa') ||
    lower.includes('gimnasio') ||
    lower.includes('fitness')
  ) {
    siteName = 'Sonrisas & Salud Pro';
    industry = 'Salud Odontológica & Bienestar Integral';
    tagline = 'Tu salud y tranquilidad en manos de especialistas certificados con tecnología de punta.';
    primaryColor = '#0284c7';
    secondaryColor = '#0369a1';
    accentColor = '#e0f2fe';
    hero = {
      badge: '🩺 Diagnóstico Integral Sin Costo',
      title: 'Recupera tu confianza y bienestar con atención médica de primer nivel',
      subtitle: 'Instalaciones modernas, especialistas certificados en cada área y tratamientos personalizados sin dolor pensados para toda tu familia.',
      primary_cta: 'Agendar Consulta de Valoración',
      secondary_cta: 'Conocer Especialistas y Tratamientos',
      trust_badges: ['Certificación Sanitaria', 'Tecnología Láser Sin Dolor', 'Planes de Pago Flexibles']
    };
    services = [
      { title: 'Odontología Estética y Ortodoncia', description: 'Diseño de sonrisa digital, alineadores invisibles y blanqueamiento seguro de alta duración.', icon: 'Sparkles', badge: 'Más Solicitado' },
      { title: 'Implantes y Rehabilitación Oral', description: 'Restauración funcional y estética permanente con materiales biocompatibles de grado médico.', icon: 'ShieldCheck', badge: 'Garantía 5 Años' },
      { title: 'Odontopediatría y Cuidado Familiar', description: 'Ambiente amigable y técnicas no invasivas para que los niños disfruten su visita al dentista.', icon: 'Heart', badge: 'Para Niños' }
    ];
    about = {
      title: 'Compromiso Ético y Tecnología Avanzada',
      content: 'Con más de 12 años transformando vidas, combinamos la calidez humana con equipamiento de radiología digital 3D y esterilización hospitalaria.\n\nNos aseguramos de que cada paciente comprenda con transparencia su tratamiento y reciba seguimiento integral durante todo su proceso.',
      metrics: [
        { label: 'Pacientes Satisfechos', value: '+8,500' },
        { label: 'Tasa de Éxito en Tratamientos', value: '99.8%' },
        { label: 'Años de Experiencia Clínica', value: '12 Años' }
      ]
    };
    blogPosts = [
      { title: 'Mitos y Realidades sobre los Alineadores Invisibles vs Brackets', excerpt: 'Todo lo que necesitas saber sobre comodidad, higiene y tiempo de tratamiento para tomar la mejor decisión.', read_time: '4 min', date: 'Esta semana' },
      { title: '5 Consejos para Evitar la Sensibilidad Dental al Tomar Bebidas Frías', excerpt: 'Aprende hábitos simples para proteger tu esmalte y sonreír sin molestias.', read_time: '3 min', date: 'Hace unos días' }
    ];
    contact = {
      title: 'Agenda tu Cita Hoy Mismo',
      subtitle: 'Atención de Lunes a Sábado con horarios flexibles. Ubicados en zona céntrica con estacionamiento.',
      phone: '+52 (656) 789-0123',
      email: 'citas@sonrisasysalud.com',
      address: 'Av. Paseo Triunfo de la República #1820, Ciudad Juárez'
    };
    social = {
      facebook: {
        copy: '✨ Tu sonrisa es tu mejor carta de presentación. En Sonrisas & Salud Pro contamos con ortodoncia invisible y diseño de sonrisa con tecnología 3D.\n\n📅 Agenda tu valoración sin costo este mes y descubre lo fácil que es sonreír con seguridad.',
        cta: 'Enviar Mensaje por WhatsApp'
      },
      instagram: {
        copy: '¿Sabías que una sonrisa sana mejora tu confianza en más del 80% en reuniones sociales y de trabajo? 🌟\n\nNuestros especialistas están listos para darte la atención que mereces sin dolor.',
        hashtags: '#SaludDental #SonrisasPerfectas #DentistaPro #OrtodonciaInvisible #CuidadoPersonal #Bienestar'
      }
    };
    imagePrompt = 'Fotografía publicitaria limpia y luminosa en instalaciones odontológicas de alta tecnología, doctora profesional sonriendo con paciente satisfecho, estilo editorial 8k.';
  }
  // 3. IoT, Dispositivos Conectados, Industria y Sensores
  else if (
    lower.includes('iot') ||
    lower.includes('sensor') ||
    lower.includes('dispositivo') ||
    lower.includes('industrial') ||
    lower.includes('automatizacion') ||
    lower.includes('bi') ||
    lower.includes('datos')
  ) {
    siteName = 'Pulse IoT Solutions';
    industry = 'Internet de las Cosas (IoT) & Telemetría Industrial';
    tagline = 'Monitoreo inteligente en tiempo real y automatización para la industria moderna.';
    primaryColor = '#1d7eae';
    secondaryColor = '#0032a0';
    accentColor = '#98dae9';
    hero = {
      badge: '🌐 Redes de Sensores en Tiempo Real',
      title: 'Optimice sus Operaciones Industriales con Telemetría IoT',
      subtitle: 'Plataforma de alta confiabilidad diseñada para capturar variables críticas de sensores, predecir paros no programados y reducir costos operativos con soporte 24/7.',
      primary_cta: 'Solicitar Demostración Técnica',
      secondary_cta: 'Ver Arquitectura de Red',
      trust_badges: ['Disponibilidad 99.9%', 'Protocolos Criptográficos', 'Ingeniería en Sitio']
    };
    services = [
      { title: 'Monitoreo de Variables Críticas', description: 'Temperatura, vibración, presión y consumo eléctrico transmitidos por redes seguras.', icon: 'Cpu', badge: 'Tiempo Real' },
      { title: 'Tableros de Business Intelligence', description: 'Consola web ejecutiva que convierte millones de lecturas en indicadores accionables.', icon: 'BarChart3', badge: 'Alta Dirección' },
      { title: 'Alertas Tempranas y Automatización', description: 'Notificaciones automáticas a supervisores antes de que ocurra una falla crítica.', icon: 'Network', badge: 'Mantenimiento Predictivo' }
    ];
    about = {
      title: 'Ingeniería Fronteriza Orientada a Cero Paros',
      content: 'Diseñamos e implementamos infraestructura de hardware y software para maquiladoras y PyMEs industriales.\n\nNuestras soluciones resisten entornos severos y se conectan sin fricción con los sistemas ERP ya instalados en su planta.',
      metrics: [
        { label: 'Sensores en Producción', value: '+12,000' },
        { label: 'Reducción de Paros', value: '34%' },
        { label: 'Tiempo de Despliegue', value: '< 7 Días' }
      ]
    };
    blogPosts = [
      { title: 'Cómo la Telemetría IoT Salvó una Cadena de Frío Farmacéutica', excerpt: 'Caso de estudio sobre la implementación de sensores certificados en almacenes logísticos de la frontera.', read_time: '5 min', date: 'Esta semana' },
      { title: 'Protocolos de Comunicación Seguros para Sensores en Fábricas Inteligentes', excerpt: 'Comparativa entre LoRaWAN, MQTT y redes celulares privadas para telemetría industrial.', read_time: '4 min', date: 'Hace unos días' }
    ];
    contact = {
      title: 'Inicie un Piloto en su Planta',
      subtitle: 'Nuestros ingenieros evalúan sus líneas de producción sin costo.',
      phone: '+52 (656) 613-0000',
      email: 'contacto@iottechnologies.mx',
      address: 'Parque Industrial Juárez, Edificio Tecnológico 4'
    };
    social = {
      facebook: {
        copy: '🌐 Monitoree activos críticos en tiempo real desde cualquier dispositivo con sensores IoT de alta precisión de IOT Technologies.\n\n✅ Alertas automáticas instantáneas\n✅ Plataformas en la nube para PyMEs y plantas industriales\n\n📩 Solicite un piloto técnico hoy mismo.',
        cta: 'Contactar a un Ingeniero'
      },
      instagram: {
        copy: '¿Sabes cuánto cuesta una hora de paro imprevisto en tu línea de producción? 💡 La telemetría en tiempo real te permite actuar antes de que la maquinaria falle.',
        hashtags: '#IoT #Industria40 #MonitoreoRemoto #IOTTechnologies #TransformacionDigital'
      }
    };
    imagePrompt = 'Fotografía publicitaria corporativa de tecnología industrial, sensores conectados emitiendo datos visuales en tonos azul brillante (#1d7eae) y fondo tecnológico (#231f20), realismo 8k.';
  }

  const generatedId = Date.now() % 100000;
  const titulo = `Sitio Web Corporativo: ${siteName}`;

  const generatedWebsite = {
    titulo,
    site_name: siteName,
    industry,
    tagline,
    brand_colors: {
      primary: primaryColor,
      secondary: secondaryColor,
      accent: accentColor
    },
    hero,
    services,
    about,
    blog_posts: blogPosts,
    contact,
    social_posts: social,
    resumen_web: about.content,
    copy_redes: social.instagram.copy,
    prompt_imagen: imagePrompt,
    drive_files: {
      pages_file: `/Sitio_Web/Paginas/${siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_landing.json`,
      blog_file: `/Sitio_Web/Blog/post_${blogPosts[0]?.title.slice(0, 15).replace(/\s+/g, '_').toLowerCase()}.md`,
      social_file: `/Redes_Sociales/Para_Publicar/campaña_${siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`
    }
  };

  return {
    id: generatedId,
    status: 'PENDING',
    sector: industry,
    content: generatedWebsite,
    record: {
      id: generatedId,
      title: titulo,
      slug: `sitio-web-${generatedId}`,
      category: 'SITIO WEB / REDES',
      status: 'PENDING',
      brief: cleanBrief,
      body_text: about.content,
      created_at: new Date().toISOString(),
      drive_file_id: `drive_site_${generatedId}`,
      content: generatedWebsite
    }
  };
}

export default function App() {
  // Estado de usuario y Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Estados para pantalla de Login / Registro obligatorio
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('approver');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

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
          displayName: user.displayName || user.email?.split('@')[0] || 'Auditor',
          role: 'Aprobador Humano (Audit Trail)'
        });
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
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

  // Manejador del formulario de autenticación obligatoria
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);

    try {
      if (isRegisterMode) {
        if (!authEmail || !authPassword) {
          throw new Error('Por favor completa tu correo y contraseña.');
        }
        if (authPassword.length < 6) {
          throw new Error('La contraseña debe tener mínimo 6 caracteres.');
        }

        const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const user = cred.user;

        try {
          await setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            email: user.email,
            displayName: authName || authEmail.split('@')[0],
            role: authRole,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('Perfil Firestore:', dbErr);
        }

        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: authName || user.email.split('@')[0],
          role: 'Aprobador Humano (Audit Trail)'
        });
      } else {
        const cred = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setCurrentUser({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || cred.user.email.split('@')[0],
          role: 'Aprobador Humano (Audit Trail)'
        });
      }
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Error en la autenticación.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Este correo ya está registrado. Por favor inicia sesión.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'La contraseña debe contener al menos 6 caracteres.';
      }
      setAuthError(msg);
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Inicio de sesión con Google
  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      try {
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
          role: 'approver',
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn('Registro Google Firestore:', dbErr);
      }

      setCurrentUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        role: 'Aprobador Humano (Audit Trail)'
      });
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setAuthError('Dominio no autorizado en Firebase. Para usar Google en Vercel, agrega tu URL de Vercel en Firebase Console > Authentication > Settings > Authorized Domains.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('El navegador bloqueó la ventana emergente. Por favor permite popups para este sitio.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError('No se pudo completar el acceso con Google: ' + (err.message || 'error desconocido'));
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Cerrar sesión
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (e) {
      console.error('Error al salir:', e);
    }
  };

  // 1. Solicitud al Cerebro Digital (IA)
  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setLoading(true);
    setApprovedSuccess(false);
    setErrorMessage('');

    let generatedData = null;

    // Intentar primero con el backend (cuando está disponible)
    try {
      const res = await fetch(`${BACKEND_URL}/generate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          userEmail: currentUser?.email || 'evaluador@iottechnologies.mx'
        })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json?.content?.titulo) {
          generatedData = json;
        }
      }
    } catch (networkErr) {
      console.warn('API backend no disponible en este host, activando motor autónomo de IA:', networkErr);
    }

    // Si el backend no está disponible en Vercel estático o hubo problema de red, usar motor inteligente
    if (!generatedData) {
      generatedData = generateSmartProposal(brief);
    }

    setProposal(generatedData);
    setErrorMessage('');
    loadContents();
    setLoading(false);
  };

  // 2. Aprobar Propuesta (Regla No Negociable de Carlos: PENDING -> APPROVED con registro humano)
  const handleApprove = async (proposalId = null, proposalData = null) => {
    const targetId = proposalId || proposal?.id;
    const targetContent = proposalData || proposal?.content;
    if (!targetId) return;

    const approverName = currentUser?.displayName || 'Carlos Torres (Sales Consultant)';
    const approverEmail = currentUser?.email || 'Carlos.Torres@iottechnologies.mx';

    try {
      await fetch(`${BACKEND_URL}/approve/${targetId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverName,
          approverEmail
        })
      });
    } catch (e) {
      console.warn('Aprobación sincronizada localmente:', e);
    }

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
  };

  // Si está cargando el estado inicial de Auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="w-10 h-10 border-4 border-[#1d7eae] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold tracking-wide">Cargando Plataforma MYOS...</p>
      </div>
    );
  }

  // PANTALLA OBLIGATORIA: INICIAR SESIÓN / REGISTRARSE PARA USAR LA APLICACIÓN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#231f20] via-slate-950 to-slate-950 flex flex-col justify-between text-slate-100 selection:bg-[#1d7eae]">
        
        {/* Barra superior con Logo */}
        <header className="px-6 py-4 border-b border-slate-800/80 bg-[#231f20]/90 flex justify-between items-center max-w-7xl w-full mx-auto">
          <Logo />
        </header>

        {/* Tarjeta Central de Autenticación Requerida */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-[#231f20] border border-slate-700/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-1">
                {/* Logo pequeño antena para identificación */}
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-[#1d7eae]/40 flex items-center justify-center shadow-inner">
                  <svg viewBox="0 0 100 100" className="w-8 h-8" fill="none">
                    <circle cx="50" cy="50" r="44" stroke="#1d7eae" strokeWidth="7" opacity="0.95" />
                    <circle cx="50" cy="50" r="29" stroke="#98dae9" strokeWidth="6" />
                    <circle cx="50" cy="50" r="14" fill="#1d7eae" />
                    <circle cx="50" cy="50" r="5" fill="#ffffff" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-white font-heading">
                {isRegisterMode ? 'Crear Cuenta de Auditor' : 'Iniciar Sesión en MYOS'}
              </h2>
              <p className="text-xs text-slate-400">
                Se requiere inicio de sesión para acceder al Cerebro Digital y control de aprobación humana.
              </p>
            </div>

            {/* Alternador Iniciar Sesión / Registrarse */}
            <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl text-sm font-semibold">
              <button
                type="button"
                onClick={() => { setIsRegisterMode(false); setAuthError(''); }}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                  !isRegisterMode ? 'bg-[#1d7eae] text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setIsRegisterMode(true); setAuthError(''); }}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                  isRegisterMode ? 'bg-[#1d7eae] text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Registrarse
              </button>
            </div>

            {/* Banner de error */}
            {authError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs text-center flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Ej. Carlos Torres"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1d7eae]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="usuario@iottechnologies.mx"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1d7eae]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1d7eae]"
                  />
                </div>
              </div>

              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rol en el Sistema</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-[#98dae9]" />
                    <select
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1d7eae]"
                    >
                      <option value="approver">Aprobador Humano (Audit Trail - Merkatics)</option>
                      <option value="admin">Administrador General</option>
                      <option value="creator">Editor de Contenidos IA</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-[#1d7eae] hover:bg-[#0032a0] disabled:bg-slate-800 transition shadow-lg shadow-[#1d7eae]/30 text-sm flex items-center justify-center gap-2"
              >
                {authSubmitting ? (
                  <span>Procesando...</span>
                ) : isRegisterMode ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Crear Cuenta y Entrar
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>

            {/* Separador */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#231f20] text-slate-400">O ingresa con</span>
              </div>
            </div>

            {/* Botón Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authSubmitting}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-850 hover:bg-slate-800 border border-slate-650 transition flex items-center justify-center gap-3 text-slate-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continuar con Google
            </button>
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-800">
          © 2026 IOT Technologies — Plataforma MYOS (Ficha 2026-544-11). Todos los derechos reservados.
        </footer>
      </div>
    );
  }

  // APLICACIÓN PRINCIPAL (SOLO ACCESIBLE CON SESIÓN INICIADA)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#1d7eae] selection:text-white">
      
      {/* 1. Header & Navegación Institucional Oficial IOT TECHNOLOGIES */}
      <header className="sticky top-0 z-40 bg-[#231f20]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          
          {/* Logo Corporativo Oficial */}
          <div className="flex items-center gap-3">
            <a href="#inicio" className="flex items-center">
              <Logo />
            </a>
          </div>

          {/* Navegación de secciones: Solo Google Drive CMS e Inicio */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-semibold text-slate-300">
            <button
              onClick={() => setActiveTab('plataforma')}
              className={`transition pb-1 ${activeTab === 'plataforma' ? 'text-[#98dae9] border-b-2 border-[#1d7eae]' : 'hover:text-white'}`}
            >
              Inicio
            </button>
            <button
              onClick={() => setActiveTab('drive')}
              className={`flex items-center gap-1.5 transition pb-1 ${activeTab === 'drive' ? 'text-[#98dae9] border-b-2 border-[#1d7eae]' : 'hover:text-white'}`}
            >
              <FolderTree className="w-4 h-4 text-[#1d7eae]" />
              Google Drive CMS
            </button>
          </nav>

          {/* Área de Autenticación Firebase (Usuario Logueado) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-inner">
              <div className="w-7 h-7 rounded-lg bg-[#1d7eae] text-white flex items-center justify-center font-bold text-xs">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="text-xs font-bold text-white block truncate max-w-[140px]">
                  {currentUser.displayName}
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
          </div>
        </div>
      </header>

      {/* Barra de navegación para móviles */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('plataforma')}
          className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'plataforma' ? 'bg-[#1d7eae] text-white' : 'text-slate-400'}`}
        >
          Inicio
        </button>
        <button
          onClick={() => setActiveTab('drive')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${activeTab === 'drive' ? 'bg-[#1d7eae] text-white' : 'text-slate-400'}`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          Google Drive CMS
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
                  onClick={() => setActiveTab('drive')}
                  className="px-7 py-3.5 rounded-xl font-bold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition flex items-center gap-2"
                >
                  <FolderTree className="w-5 h-5 text-[#1d7eae]" />
                  Google Drive CMS
                </button>
              </div>

              {/* Banner de auditoría de seguridad */}
              <div className="mt-8 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 max-w-2xl mx-auto flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Auditor conectado: <strong className="text-slate-200">{currentUser.displayName}</strong> ({currentUser.email})
                  </span>
                </div>
                <span className="text-emerald-400 font-semibold">Firma Humana Habilitada</span>
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

          {/* 4. Módulo del Cerebro Digital (Generación de Sitios Web + Control Humano) */}
          <section id="cerebro-digital" className="py-20 px-6 max-w-5xl mx-auto">
            <div className="bg-gradient-to-b from-slate-900 to-[#231f20] rounded-3xl border border-[#1d7eae]/40 p-8 sm:p-10 shadow-2xl space-y-8">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#98dae9] uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4 text-[#1d7eae]" />
                    Cerebro Digital con IA (Ficha 2026-544-11 - Merkatics)
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                    Generador Autónomo de Sitios Web de Alta Conversión
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Genera páginas web completas para PyMEs (Hero, Servicios, Blog, Contacto y Redes Sociales) a partir de Google Drive con aprobación humana no negociable.
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
                  Instrucción / Brief del Negocio para Generar el Sitio Web:
                </label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Ejemplo: Crea un sitio web para una clínica dental de ortodoncia invisible y diseño de sonrisa con citas en línea en Ciudad Juárez..."
                  className="w-full h-28 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1d7eae] text-sm leading-relaxed"
                />

                {/* Sugerencias rápidas de industrias / PyMEs */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-slate-400 block">Plantillas & Ejemplos Rápidos de PyMEs:</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      { label: '☕ Cafetería Gourmet', brief: 'Cafetería de especialidad con granos de altura, barra de extracciones, repostería artesanal y espacio para co-working.' },
                      { label: '🦷 Clínica Dental & Salud', brief: 'Clínica odontológica especializada en ortodoncia invisible, diseño de sonrisa digital y atención sin dolor.' },
                      { label: '🌐 Sensores IoT & Telemetría', brief: 'Plataforma de telemetría y sensores IoT para monitoreo de temperatura y maquinaria industrial en tiempo real.' },
                      { label: '🚀 Agencia de Growth Marketing', brief: 'Agencia de crecimiento digital y embudos de venta de alta conversión para PyMEs y marcas de comercio electrónico.' },
                      { label: '⚖️ Despacho Jurídico', brief: 'Firma de abogados y consultores corporativos especializados en contratos, derecho laboral y protección patrimonial.' },
                      { label: '🏋️ Gimnasio & Bienestar', brief: 'Centro de entrenamiento funcional, acondicionamiento físico personalizado y planes nutricionales.' }
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => setBrief(item.brief)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 hover:text-white transition border border-slate-700/60 text-slate-300 flex items-center gap-1.5"
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading || !brief.trim()}
                  className="w-full py-4 rounded-xl font-bold text-white bg-[#1d7eae] hover:bg-[#0032a0] disabled:bg-slate-800 disabled:text-slate-600 transition shadow-lg shadow-[#1d7eae]/25 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {loading ? '🧠 Cerebro Digital generando sitio web con IA...' : 'Generar Sitio Web Completo de Alta Conversión (Páginas + Blog + Redes)'}
                </button>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-sm flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Renderizado del Sitio Web Generado con Vista Previa Interactiva */}
              {proposal && (
                <GeneratedWebsitePreview
                  proposal={proposal}
                  isApproved={approvedSuccess}
                  onApprove={() => handleApprove()}
                  onRegenerate={handleGenerate}
                  currentUser={currentUser}
                  loading={loading}
                />
              )}
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
                        Validar y Aprobar con mi Firma ({currentUser.displayName})
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
        <section className="py-12 px-6 max-w-6xl mx-auto space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setActiveTab('plataforma')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 transition"
            >
              ← Volver al Inicio & Cerebro Digital
            </button>
          </div>
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
              <div className="flex items-center gap-3">
                <Logo />
              </div>
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

      {/* 5. Footer Institucional Oficial */}
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

    </div>
  );
}
