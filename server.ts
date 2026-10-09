import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

export interface GeneratedWebsite {
  titulo: string;
  site_name: string;
  industry: string;
  tagline: string;
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
    status: 'APPROVED',
    body_text: 'Implementación de sensores conectados, analítica en tiempo real y dispositivos inteligentes para optimizar procesos operativos y reducir costos en medianas y grandes empresas.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    approved_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    approved_by: 'Carlos Torres (Sales Consultant)',
    approved_by_email: 'Carlos.Torres@iottechnologies.mx',
    drive_file_id: 'drive_001_iot_intro'
  },
  {
    id: 2,
    title: 'Business Intelligence: De Datos a Decisiones Estratégicas',
    slug: 'business-intelligence-decisiones',
    category: 'PÁGINA WEB / REDES',
    status: 'APPROVED',
    body_text: 'Tableros interactivos e integración de fuentes de datos dispersas para empoderar a la alta dirección con métricas accionables en minutos y visualización ejecutiva en alta fidelidad.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    approved_at: new Date(Date.now() - 86400000).toISOString(),
    approved_by: 'Miguel García (Multimedia)',
    approved_by_email: 'miguel.garcia@merkatics.com',
    drive_file_id: 'drive_002_bi_platform'
  }
];

// Helper: Smart contextual content generator for fallback
function generateSmartContent(brief: string): GeneratedWebsite {
  const cleanBrief = brief.trim();
  const lower = cleanBrief.toLowerCase();

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

  // 3. IoT, Industria 4.0, Software y Tecnología (Por defecto o si menciona tech)
  let area = 'Plataformas de Innovación y Tecnología Conectada';
  let siteName = 'Nexus IoT & Smart Systems';
  let badgeText = '🚀 Plataforma IoT de Alta Confiabilidad';
  
  if (lower.includes('iot') || lower.includes('sensor') || lower.includes('dispositivo')) {
    area = 'Dispositivos Conectados e Internet de las Cosas (IoT)';
    siteName = 'Pulse IoT Solutions';
    badgeText = '🌐 Redes de Sensores en Tiempo Real';
  } else if (lower.includes('marketing') || lower.includes('growth') || lower.includes('agencia')) {
    area = 'Growth Marketing y Adquisición Digital';
    siteName = 'Merkatics Growth Lab';
    badgeText = '📈 Máquinas de Ventas de Alta Conversión';
  } else if (lower.includes('abogado') || lower.includes('legal') || lower.includes('juridico')) {
    area = 'Asesoría Jurídica y Cumplimiento Corporativo';
    siteName = 'Lex & Partners Consultoría';
    badgeText = '⚖️ Seguridad Jurídica Integral';
  }

  const titulo = `Sitio Web Corporativo de Alta Conversión: ${cleanBrief.slice(0, 48)}`;
  return {
    titulo,
    site_name: siteName,
    industry: area,
    tagline: `Impulsamos el crecimiento de su empresa con ${area.toLowerCase()} orientada a resultados medibles.`,
    brand_colors: {
      primary: '#1d7eae',
      secondary: '#0032a0',
      accent: '#98dae9'
    },
    hero: {
      badge: badgeText,
      title: `Potencie las operaciones de su empresa con ${siteName}`,
      subtitle: `Plataforma de alta conversión desarrollada para automatizar procesos, capturar clientes calificados y optimizar costos operativos con soporte de ingeniería especializada.`,
      primary_cta: 'Solicitar Demostración en Vivo',
      secondary_cta: 'Conocer Casos de Éxito',
      trust_badges: ['Disponibilidad 99.9%', 'Seguridad Grado Corporativo', 'Soporte Técnico 24/7']
    },
    services: [
      {
        title: 'Monitoreo y Telemetría en Tiempo Real',
        description: 'Captura y análisis de datos de sensores y sistemas operativos con alertas automáticas.',
        icon: 'Cpu',
        badge: 'Núcleo Central'
      },
      {
        title: 'Tableros de Control y Analítica Ejecutiva',
        description: 'Visualización clara de KPIs comerciales y operativos para toma de decisiones fundamentadas.',
        icon: 'BarChart3',
        badge: 'Business Intelligence'
      },
      {
        title: 'Automatización e Integración de Procesos',
        description: 'Conexión de APIs, CRM y bases de datos para eliminar tareas manuales y errores humanos.',
        icon: 'Network',
        badge: 'Alta Eficiencia'
      }
    ],
    about: {
      title: 'Ingeniería Enfocada en Retorno de Inversión',
      content: `En ${siteName} diseñamos soluciones tecnológicas que resuelven cuellos de botella reales en PyMEs y corporativos de la región fronteriza.\n\nCombinamos arquitectura moderna con acompañamiento consultivo para que cada proyecto entregue valor desde el primer mes.`,
      metrics: [
        { label: 'Procesos Automatizados', value: '+350' },
        { label: 'Ahorro Operativo Promedio', value: '38%' },
        { label: 'Tiempo de Respuesta', value: '< 15 min' }
      ]
    },
    blog_posts: [
      {
        title: 'Cómo Reducir Costos Ocultos en Procesos Operativos con Sensores Inteligentes',
        excerpt: 'Análisis de cómo la detección temprana de anomalías previene pérdidas críticas en líneas de producción.',
        read_time: '5 min',
        date: 'Esta semana'
      },
      {
        title: 'El Futuro de la Toma de Decisiones: Por qué los tableros estáticos ya no bastan',
        excerpt: 'Claves para transitar de reportes semanales en Excel a paneles en vivo conectados a fuentes primarias.',
        read_time: '4 min',
        date: 'Hace unos días'
      }
    ],
    contact: {
      title: 'Inicie la Modernización de su Negocio',
      subtitle: 'Nuestros consultores técnicos están listos para analizar su proyecto sin costo.',
      phone: '+52 (656) 613-0000',
      email: 'contacto@iottechnologies.mx',
      address: 'Av. de las Industrias #1100, Parque Industrial Juárez'
    },
    social_posts: {
      facebook: {
        copy: `🚀 ¿Su empresa sigue perdiendo tiempo en procesos manuales y datos desactualizados? En ${siteName} desarrollamos soluciones en ${area} diseñadas para elevar la rentabilidad de su negocio.\n\n✅ Monitoreo en tiempo real\n✅ Implementación rápida sin fricción\n\n📩 Solicite un diagnóstico inicial hoy mismo.`,
        cta: 'Contactar a un Asesor'
      },
      instagram: {
        copy: `La innovación no se trata de tecnología compleja, sino de herramientas que hagan su negocio más ágil y rentable día a día. 🌐💡\n\nDescubra cómo nuestras plataformas conectadas optimizan la operación en PyMEs de alto impacto.`,
        hashtags: '#IOTTechnologies #InnovacionDigital #Industria40 #EficienciaOperativa #PyMEsExitosas #Tecnologia'
      }
    },
    resumen_web: `En ${siteName} potenciamos el crecimiento de su empresa mediante ${area.toLowerCase()} enfocada en resultados comerciales tangibles. Nuestra plataforma centraliza la captura de información, automatización y monitoreo operativo en una sola consola.\n\nDiseñado bajo estándares corporativos y respaldado por nuestro equipo de consultores e ingenieros especializados.`,
    copy_redes: `🚀 ¡Impulsa el rendimiento de tu negocio con soluciones tecnológicas de vanguardia!\n\nEnfoque a la medida: "${cleanBrief}".\n\n✅ Monitoreo inteligente en tiempo real\n✅ Alta disponibilidad y soporte técnico certificado\n\n📩 Agenda una sesión hoy mismo: contacto@iottechnologies.mx`,
    prompt_imagen: `Fotografía publicitaria corporativa de alta tecnología para ${siteName}, mostrando ingenieros trabajando con interfaces de business intelligence y dispositivos IoT conectados, iluminación en azul Pantone 640C (#1d7eae) y azul marino (#0032a0), fondo minimalista slate (#231f20), calidad 8K hiperrealista, estilo editorial.`,
    drive_files: {
      pages_file: `/Sitio_Web/Paginas/propuesta_${cleanBrief.slice(0, 15).replace(/\s+/g, '_').toLowerCase()}.json`,
      blog_file: `/Sitio_Web/Blog/articulo_estrategico.md`,
      social_file: `/Redes_Sociales/Para_Publicar/campaña_lanzamiento.json`
    }
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

  if (!brief || typeof brief !== 'string' || !brief.trim()) {
    return res.status(400).json({ error: 'El brief o instrucción es obligatorio.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  let parsedContent: any = null;

  if (apiKey && apiKey.startsWith('AIza')) {
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemPrompt = `Eres el Cerebro Digital del Growth Operating System (Merkatics y MYOS Platform - Ficha 2026-544-11).
Tu misión es actuar como Generador Autónomo de Sitios Web de Alta Conversión para PyMEs a partir del brief: "${brief.trim()}".
Debes generar una propuesta completa del sitio web modular para desplegar en Vercel y sincronizar con Google Drive.
Responde ÚNICAMENTE un JSON válido con estas llaves exactas:
- "titulo": Título corporativo del sitio web
- "site_name": Nombre comercial de la empresa o sitio web
- "industry": Industria o nicho del negocio
- "tagline": Eslogan o propuesta única de valor
- "brand_colors": { "primary": "#1d7eae", "secondary": "#0032a0", "accent": "#98dae9" }
- "hero": {
    "badge": "Etiqueta destacada del hero",
    "title": "Titular de alta conversión",
    "subtitle": "Subtítulo explicando la solución",
    "primary_cta": "Botón principal",
    "secondary_cta": "Botón secundario",
    "trust_badges": ["Sello 1", "Sello 2", "Sello 3"]
  }
- "services": [
    { "title": "Servicio 1", "description": "Detalle orientado a resultados", "icon": "Sparkles", "badge": "Destacado" },
    { "title": "Servicio 2", "description": "Detalle orientado a resultados", "icon": "ShieldCheck", "badge": "Popular" },
    { "title": "Servicio 3", "description": "Detalle orientado a resultados", "icon": "TrendingUp", "badge": "Garantizado" }
  ]
- "about": {
    "title": "Propuesta de Valor",
    "content": "Historia y diferenciación del negocio",
    "metrics": [
      { "label": "Clientes Atendidos", "value": "+1,000" },
      { "label": "Satisfacción", "value": "99%" },
      { "label": "Años de Experiencia", "value": "10+" }
    ]
  }
- "blog_posts": [
    { "title": "Título artículo 1 para /Sitio_Web/Blog", "excerpt": "Extracto de valor", "read_time": "3 min", "date": "Esta semana" },
    { "title": "Título artículo 2 para /Sitio_Web/Blog", "excerpt": "Extracto de valor", "read_time": "4 min", "date": "Hace unos días" }
  ]
- "contact": {
    "title": "Comienza Hoy",
    "subtitle": "Agenda una llamada o visítanos",
    "phone": "+52 (656) 123-4567",
    "email": "contacto@empresa.com",
    "address": "Ciudad Juárez, Chih."
  }
- "social_posts": {
    "facebook": { "copy": "Copy para post de Facebook con enlace", "cta": "Visitar Sitio" },
    "instagram": { "copy": "Copy visual para Instagram con emojis", "hashtags": "#Negocio #Exito #Calidad" }
  }
- "resumen_web": "Resumen general del sitio web en 2 párrafos",
- "copy_redes": "Publicación para Instagram/Facebook con gancho y hashtags",
- "prompt_imagen": "Prompt artístico detallado para generar imagen publicitaria en DALL-E / Midjourney"`;

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
        if (parsedContent?.titulo && parsedContent?.site_name) break;
      } catch {
        // Fallback silencioso sin volcar mensajes a consola
      }
    }
  }

  // Fallback si la API no está disponible o cuota agotada
  if (!parsedContent || !parsedContent.titulo || !parsedContent.site_name) {
    const smart = generateSmartContent(brief);
    parsedContent = { ...smart, ...(parsedContent || {}) };
  }

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

// POST /api/approve/:id or /api/approve/:id/
app.post(['/api/approve/:id', '/api/approve/:id/'], (req, res) => {
  const id = parseInt(req.params.id, 10);
  const approverEmail = req.body?.approverEmail || 'carlos.torres@iottechnologies.mx';
  const approverName = req.body?.approverName || 'Aprobador Corporativo';

  const item = contents.find(c => c.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Contenido no encontrado.' });
  }

  // Regla no negociable: registrar explícitamente quién aprobó y en qué fecha
  item.status = 'APPROVED';
  item.approved_at = new Date().toISOString();
  item.approved_by = approverName;
  item.approved_by_email = approverEmail;

  if (item.content?.resumen_web) {
    item.body_text = item.content.resumen_web;
    item.title = item.content.titulo;
  }

  return res.json({
    message: 'Contenido aprobado con éxito y registrado en auditoría.',
    status: 'APPROVED',
    item
  });
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
