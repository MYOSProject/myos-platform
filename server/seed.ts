// Sitios de ejemplo (de la versión original). Se cargan SOLO en desarrollo, como PENDIENTES
// y sin ninguna aprobación registrada: antes venían como APROBADOS a nombre de personas reales.
export const SEED_ITEMS: any[] = [
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
    status: 'APPROVED',
    body_text: 'Tableros interactivos e integración de fuentes de datos dispersas para empoderar a la alta dirección con métricas accionables en minutos y visualización ejecutiva en alta fidelidad.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    approved_at: new Date(Date.now() - 86400000).toISOString(),
    approved_by: 'Miguel García (Multimedia)',
    approved_by_email: 'miguel.garcia@merkatics.com',
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
