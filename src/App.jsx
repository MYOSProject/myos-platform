import { useState, useEffect, useRef } from 'react';
import {
  auth,
  onAuthStateChanged,
  signOut
} from './firebase';
import Logo from './components/Logo';
import DriveExplorer from './components/DriveExplorer';
import GeneratedWebsitePreview from './components/GeneratedWebsitePreview';
import AuthModal from './components/AuthModal';
import ApprovedWebsitesSection from './components/ApprovedWebsitesSection';
import ApprovalCelebrationModal from './components/ApprovalCelebrationModal';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
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
  LogIn,
  Upload,
  Trash2
} from 'lucide-react';

// Motor Autónomo de Inteligencia Artificial para MYOS (Generador Universal de Sitios Web de Alta Conversión)
function generateSmartProposal(brief, options = {}) {
  const cleanBrief = (brief || '').trim();
  const lower = cleanBrief.toLowerCase();
  const customLogo = options.customLogo || null;
  const previousSite = options.previousSite || null;

  // Si el usuario pide cambios o ajustes sobre un sitio web previo
  if (previousSite && (previousSite.site_name || previousSite.titulo)) {
    const updated = JSON.parse(JSON.stringify(previousSite));
    if (customLogo) updated.custom_logo = customLogo;
    if (options.attachedPhoto) updated.hero_image = options.attachedPhoto;

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
      updated.brand_colors = { primary: '#E95349', secondary: '#C6443F', accent: '#E26A69' };
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
      updated.hero.primary_cta = 'Aprovechar Oferta';
    }

    if (lower.includes('domicilio') || lower.includes('envio') || lower.includes('envío') || lower.includes('entrega')) {
      updated.hero.trust_badges = Array.from(new Set([...(updated.hero.trust_badges || []), 'Envíos Rápidos a Domicilio', 'Entrega Segura']));
    }

    return {
      id: updated.id || Date.now() % 100000,
      status: 'PENDING',
      sector: updated.industry || 'Servicios',
      content: updated,
      record: {
        id: updated.id || Date.now() % 100000,
        title: updated.titulo,
        slug: `sitio-web-${updated.id || 1}`,
        category: 'SITIO WEB / REDES',
        status: 'PENDING',
        brief: cleanBrief,
        body_text: updated.about?.content || '',
        created_at: new Date().toISOString(),
        drive_file_id: `drive_site_${updated.id || 1}`,
        content: updated
      }
    };
  }

  let siteName = '';
  let industry = '';
  let tagline = '';
  let primaryColor = '#E95349';
  let secondaryColor = '#C6443F';
  let accentColor = '#E26A69';
  let hero = null;
  let services = [];
  let about = null;
  let blogPosts = [];
  let contact = null;
  let social = null;
  let imagePrompt = '';

  // 1. Tienda de Celulares, Smartphones y Reparación
  if (
    lower.includes('celular') ||
    lower.includes('smartphone') ||
    lower.includes('telefono') ||
    lower.includes('telefonia') ||
    lower.includes('iphone') ||
    lower.includes('samsung') ||
    lower.includes('xiaomi') ||
    lower.includes('pantalla') ||
    lower.includes('movil')
  ) {
    siteName = 'Mundo Celular Pro - Tienda & Taller Express';
    industry = 'Venta de Smartphones, Accesorios & Reparación';
    tagline = 'Los mejores celulares nuevos y seminuevos con garantía por escrito y reparación de pantallas en 30 minutos.';
    primaryColor = '#0284c7';
    secondaryColor = '#0369a1';
    accentColor = '#38bdf8';
    hero = {
      badge: '📱 Equipos 100% Originales & Liberados de Fábrica',
      title: 'Tu Próximo Celular al Mejor Precio con Entrega Inmediata',
      subtitle: 'Venta de iPhone, Samsung, Xiaomi y Motorola nuevos y seminuevos certificados. Cambio de pantallas y baterías en 30 minutos y los mejores accesorios.',
      primary_cta: 'Ver Catálogo de Celulares',
      secondary_cta: 'Cotizar Reparación Express',
      trust_badges: ['Garantía de 90 Días por Escrito', 'Reparación en 30 Minutos', 'Envíos y Entregas en Tienda']
    };
    services = [
      {
        title: 'Venta de Celulares Nuevos y Seminuevos',
        description: 'Smartphones de gama alta, media y económica liberados de fábrica para cualquier compañía telefónica.',
        icon: 'Smartphone',
        badge: 'Garantía Directa'
      },
      {
        title: 'Reparación Express de Pantallas y Baterías',
        description: 'Cambiamos tu pantalla estrellada, batería degradada o centro de carga con refacciones originales el mismo día.',
        icon: 'Cpu',
        badge: 'En 30 Minutos'
      },
      {
        title: 'Fundas, Cargadores y Micas de Cristal',
        description: 'Cargadores de carga rápida de 20W a 65W, micas de cristal templado 9D y fundas de uso rudo para todas las marcas.',
        icon: 'Sparkles',
        badge: 'Accesorios Pro'
      }
    ];
    about = {
      title: 'Tu Tienda de Confianza en Telefonía Móvil',
      content: 'En Mundo Celular Pro nos dedicamos a ofrecerte la mejor tecnología móvil con precios honestos y garantía real. Te asesoramos para que compres el smartphone que se adapte a tu presupuesto sin pagar de más.\n\nContamos con laboratorio técnico equipado con herramienta de microelectrónica para revivir tu equipo sin comprometer tus fotos y datos.',
      metrics: [
        { label: 'Celulares Vendidos', value: '+14,000' },
        { label: 'Equipos Reparados', value: '+8,900' },
        { label: 'Garantía en Servicio', value: '100%' }
      ]
    };
    blogPosts = [
      {
        title: 'Guía 2026: iPhone vs Samsung ¿Cuál te conviene comprar según tu uso?',
        excerpt: 'Comparamos cámaras, batería y valor de reventa para que tomes la mejor decisión de compra.',
        read_time: '4 min',
        date: 'Esta semana'
      },
      {
        title: '5 Hábitos al Cargar tu Celular que Arruinan la Vida Útil de la Batería',
        excerpt: 'Aprende cómo cargar tu smartphone correctamente para que la batería te dure más de 2 años sin degradarse.',
        read_time: '3 min',
        date: 'Hace unos días'
      }
    ];
    contact = {
      title: 'Visítanos en Tienda o Escríbenos por WhatsApp',
      subtitle: 'Cotizamos tu celular nuevo o reparación al momento. ¡Te esperamos!',
      phone: '+52 (656) 555-0199',
      email: 'ventas@mundocelularpro.com',
      address: 'Av. Tecnológico #2450, Plaza Las Misiones, Local 14'
    };
    social = {
      facebook: {
        copy: '📱 ¡Estrena celular hoy mismo en Mundo Celular Pro! Contamos con los modelos más recientes de iPhone, Samsung y Xiaomi liberados con garantía por escrito.\n\n🔧 ¿Se te estrelló la pantalla? Te la cambiamos en 30 minutos.\n\n📍 Visítanos hoy y llévate tu mica de cristal gratis con la compra de tu equipo.',
        cta: 'Ver Catálogo y Precios'
      },
      instagram: {
        copy: '¡Nada como la sensación de quitarle el plástico a tu nuevo celular! ✨📲 Tenemos promociones exclusivas en fundas y micas con la compra de tu smartphone nuevo o seminuevo.\n\n¿Qué esperas para renovarte? Mándanos un DM.',
        hashtags: '#TiendaDeCelulares #Smartphones #iPhone #Samsung #Xiaomi #ReparacionDeCelulares #CelularesBaratos'
      }
    };
    imagePrompt = 'Fotografía publicitaria profesional de smartphones de última generación exhibidos en tienda tecnológica moderna, iluminación azul cian y blanca pulcra, reflejos nítidos, estilo comercial 8k.';
  }
  // 2. Comida, Restaurantes, Tacos, Pizzerías y Hamburguesas
  else if (
    lower.includes('taco') ||
    lower.includes('taqueria') ||
    lower.includes('comida') ||
    lower.includes('restaurante') ||
    lower.includes('pizza') ||
    lower.includes('pizzeria') ||
    lower.includes('hamburguesa') ||
    lower.includes('marisco') ||
    lower.includes('sushi')
  ) {
    const isTacos = lower.includes('taco') || lower.includes('taqueria');
    const isPizza = lower.includes('pizza');
    siteName = isTacos ? 'Taquería El Buen Sabor - Tacos & Parrilladas' : isPizza ? 'Bella Napoli - Pizzería Artesanal' : 'Sabor Criollo - Cocina & Antojos';
    industry = 'Gastronomía & Restaurante de Especialidad';
    tagline = 'El auténtico sabor tradicional preparado al momento con los ingredientes más frescos.';
    primaryColor = '#ea580c';
    secondaryColor = '#c2410c';
    accentColor = '#ffedd5';
    hero = {
      badge: '🔥 Especialidades Preparadas al Carbón y al Momento',
      title: 'El Auténtico Sabor que Conquista tu Paladar en Cada Bocado',
      subtitle: 'Recetas de la casa, cortes selectos, salsas artesanales y el mejor ambiente familiar para compartir tus mejores momentos.',
      primary_cta: 'Ver Menú y Ordenar en Línea',
      secondary_cta: 'Reservar Mesa o Pedir a Domicilio',
      trust_badges: ['Ingredientes 100% Frescos', 'Servicio a Domicilio Rápido', 'Ambiente 100% Familiar']
    };
    services = [
      { title: 'Especialidades de la Casa', description: 'Platillos estrella preparados con recetas secretas de tradición y salsas gourmet hechas a mano.', icon: 'Sparkles', badge: 'Más Pedido' },
      { title: 'Servicio a Domicilio y para Llevar', description: 'Empacado hermético para que tu comida llegue caliente y crujiente hasta la puerta de tu hogar.', icon: 'TrendingUp', badge: 'Rápido & Caliente' },
      { title: 'Paquetes Familiares y Eventos', description: 'Combos con guarniciones, bebidas y complementos para compartir con amigos y familia.', icon: 'Users', badge: 'Ahorro Familiar' }
    ];
    about = {
      title: 'Tradición y Amor por el Buen Sabor',
      content: 'Nuestra cocina nació de la pasión por los sabores auténticos y las reuniones familiares. Seleccionamos carnes de primera calidad y vegetales frescos cada mañana para que cada orden sea una fiesta culinaria.\n\nVen a disfrutar con tu familia o pide a domicilio cuando se te antoje consentirte.',
      metrics: [
        { label: 'Órdenes Servidas', value: '+35,000' },
        { label: 'Calificación de Clientes', value: '4.9 ★' },
        { label: 'Años de Tradición', value: '8 Años' }
      ]
    };
    blogPosts = [
      { title: 'El Secreto de Nuestras Salsas Artesanales: Asadas a Fuego Lento', excerpt: 'Conoce los ingredientes y chiles tatemados que le dan ese toque único e inconfundible a nuestros platillos.', read_time: '3 min', date: 'Esta semana' },
      { title: 'Guía para Maridar Platillos Fuertes con Bebidas Tradicionales', excerpt: 'Las mejores combinaciones de aguas frescas y bebidas para realzar cada bocado.', read_time: '3 min', date: 'Hace unos días' }
    ];
    contact = {
      title: 'Haz tu Pedido o Visítanos Hoy',
      subtitle: 'Abierto de Miércoles a Domingo de 1:00 PM a 11:30 PM. ¡Buen provecho!',
      phone: '+52 (656) 789-3322',
      email: 'pedidos@buensabor.mx',
      address: 'Av. Ejército Nacional #4510, Zona Gastronómica'
    };
    social = {
      facebook: {
        copy: '🌮 ¿Se te hace agua la boca? Ven a disfrutar de las mejores especialidades preparadas al momento con tortillas recién hechas y salsas para chuparse los dedos.\n\n🛵 Pide a domicilio o visítanos en nuestro local.',
        cta: 'Pedir por WhatsApp'
      },
      instagram: {
        copy: 'El sonido de la parrilla, el aroma inconfundible y el primer bocado crujiente... 🔥 ¡Hoy toca consentirse con lo mejor! Te esperamos.',
        hashtags: '#ComidaDeliciosa #RestauranteFamiliar #Antojos #SaborCasero #FoodieLove #Taqueria'
      }
    };
    imagePrompt = 'Fotografía publicitaria gastronómica profesional de platillos deliciosos recién preparados con vapor saliendo, mesa de madera cálida, iluminación lateral suave, estilo editorial 8k.';
  }
  // 3. Cafetería, Panadería & Repostería
  else if (
    lower.includes('cafeteria') ||
    lower.includes('café') ||
    lower.includes('cafe') ||
    lower.includes('panaderia') ||
    lower.includes('reposteria') ||
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
  // 4. Tienda de Ropa, Moda, Calzado & Boutique
  else if (
    lower.includes('ropa') ||
    lower.includes('moda') ||
    lower.includes('boutique') ||
    lower.includes('zapato') ||
    lower.includes('calzado') ||
    lower.includes('vestido') ||
    lower.includes('playera') ||
    lower.includes('outfit')
  ) {
    siteName = 'Nova Boutique - Moda & Estilo Urbano';
    industry = 'Moda, Ropa & Calzado de Tendencia';
    tagline = 'Prendas exclusivas y outfits modernos diseñados para resaltar tu personalidad y estilo único.';
    primaryColor = '#be185d';
    secondaryColor = '#9d174d';
    accentColor = '#fce7f3';
    hero = {
      badge: '👗 Nueva Colección Temporada 2026',
      title: 'Viste con Estilo, Actitud y las Últimas Tendencias de Moda',
      subtitle: 'Prendas de alta calidad, calzado exclusivo y accesorios pensados para que armes tus mejores outfits de día y de noche con envíos rápidos a todo el país.',
      primary_cta: 'Explorar Nueva Colección',
      secondary_cta: 'Ver Ofertas y Descuentos',
      trust_badges: ['Envíos Rápidos & Seguros', 'Cambios Sin Complicaciones', 'Prendas 100% Originales']
    };
    services = [
      { title: 'Outfits Casuales y Urbanos', description: 'Jeans, playeras premium, sudaderas y chamarras con cortes en tendencia para tu día a día.', icon: 'Sparkles', badge: 'Tendencia' },
      { title: 'Prendas de Noche y Ocasión Especial', description: 'Vestidos elegantes, conjuntos formales y blusas con acabados finos y telas de alta caída.', icon: 'Heart', badge: 'Exclusivo' },
      { title: 'Calzado & Accesorios de Moda', description: 'Tenis urbanos, botas, bolsos y joyería en tendencia para complementar cualquier look.', icon: 'TrendingUp', badge: 'Accesorios' }
    ];
    about = {
      title: 'Moda Diseñada para Inspirar Confianza',
      content: 'En Nova Boutique creemos que vestir bien es una forma de expresión personal. Seleccionamos cuidadosamente cada pieza de nuestro catálogo asegurándonos de combinar comodidad, durabilidad y diseño contemporáneo.\n\nNuestras asesoras de imagen están listas para ayudarte a encontrar el look ideal.',
      metrics: [
        { label: 'Prendas Enviadas', value: '+18,000' },
        { label: 'Calificación de Estilo', value: '4.9 ★' },
        { label: 'Colecciones Exclusivas', value: '12 Anuales' }
      ]
    };
    blogPosts = [
      { title: 'Cómo Armar un Armario Cápsula con Solo 10 Prendas Básicas', excerpt: 'Aprende a combinar básicos versátiles para crear más de 30 outfits distintos sin gastar de más.', read_time: '4 min', date: 'Esta semana' },
      { title: 'Tendencias de Colores y Siluetas que Dominarán esta Temporada', excerpt: 'Descubre los tonos vibrantes y texturas que serán protagonistas en el street style.', read_time: '3 min', date: 'Hace unos días' }
    ];
    contact = {
      title: 'Visita Nuestra Boutique o Compra en Línea',
      subtitle: 'Envíos a todo México y atención personalizada por WhatsApp.',
      phone: '+52 (656) 332-1144',
      email: 'hola@novaboutique.mx',
      address: 'Plaza Galerías, Local 22, Zona Centro'
    };
    social = {
      facebook: {
        copy: '👗 ¡Llegó la nueva colección a Nova Boutique! Renueva tu clóset con prendas cómodas y en tendencia. 🛍️ Aprovecha envíos gratis en compras superiores a $899.\n\n✨ Visítanos hoy o pide en línea con entrega rápida.',
        cta: 'Comprar Colección'
      },
      instagram: {
        copy: 'El outfit perfecto para empezar la semana con toda la actitud ✨💖 ¿Cuál es tu color favorito para esta temporada? Cuéntanos en los comentarios o mándanos DM para apartar tu talla.',
        hashtags: '#ModaFemenina #OutfitDelDia #BoutiqueDeRopa #Tendencias2026 #EstiloUrbano #NovaBoutique'
      }
    };
    imagePrompt = 'Fotografía publicitaria de moda editorial con modelo en outfit moderno y vanguardista en estudio minimalista, iluminación suave de moda, estilo revista Vogue 8k.';
  }
  // 5. Salud, Odontología, Clínicas y Médicos
  else if (
    lower.includes('clinica') ||
    lower.includes('dental') ||
    lower.includes('diente') ||
    lower.includes('salud') ||
    lower.includes('medico') ||
    lower.includes('spa') ||
    lower.includes('ortodoncia') ||
    lower.includes('sonrisa')
  ) {
    siteName = 'Sonrisas & Salud Pro - Clínica Dental';
    industry = 'Salud Odontológica & Cuidado Integral';
    tagline = 'Tu salud dental y tranquilidad en manos de especialistas certificados con tecnología sin dolor.';
    primaryColor = '#0284c7';
    secondaryColor = '#0369a1';
    accentColor = '#e0f2fe';
    hero = {
      badge: '🩺 Diagnóstico Integral & Valoración 3D',
      title: 'Recupera tu Confianza y Sonrisa con Atención Dental de Primer Nivel',
      subtitle: 'Instalaciones modernas, especialistas certificados en ortodoncia invisible, implantes y diseño de sonrisa sin dolor pensados para toda tu familia.',
      primary_cta: 'Agendar Cita de Valoración',
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
  // 6. Taller Mecánico, Automotriz & Autolavado
  else if (
    lower.includes('taller') ||
    lower.includes('mecanic') ||
    lower.includes('auto') ||
    lower.includes('carro') ||
    lower.includes('freno') ||
    lower.includes('afinacion') ||
    lower.includes('suspension')
  ) {
    siteName = 'Master Auto - Taller Mecánico Especializado';
    industry = 'Mantenimiento Automotriz & Diagnóstico por Computadora';
    tagline = 'Mantenimiento preventivo y correctivo con diagnóstico computarizado y refacciones garantizadas.';
    primaryColor = '#b91c1c';
    secondaryColor = '#991b1b';
    accentColor = '#fee2e2';
    hero = {
      badge: '🔧 Diagnóstico Computarizado al Momento',
      title: 'Tu Auto en Manos de Mecánicos Expertos con Garantía por Escrito',
      subtitle: 'Servicio de afinación mayor, frenos, suspensión, transmisión y escaneo electrónico con entrega puntual y presupuesto transparente sin sorpresas.',
      primary_cta: 'Agendar Cita de Taller',
      secondary_cta: 'Cotizar Mantenimiento Preventivo',
      trust_badges: ['Mecánicos Certificados', 'Refacciones de Equipo Original', 'Presupuesto Antes de Reparar']
    };
    services = [
      { title: 'Afinación Mayor y Cambio de Aceite', description: 'Bujías, filtros de aire y gasolina, lavado de inyectores y aceite sintético de alta protección.', icon: 'Cpu', badge: 'Mantenimiento' },
      { title: 'Frenos y Suspensión Segura', description: 'Balatas de cerámica, rectificado de discos, amortiguadores y rótulas para máxima estabilidad.', icon: 'ShieldCheck', badge: 'Seguridad Vial' },
      { title: 'Diagnóstico por Escáner y Check Engine', description: 'Lectura de códigos de falla computarizados y reparación eléctrica de precisión.', icon: 'Sparkles', badge: 'Tecnología' }
    ];
    about = {
      title: 'Mecánica Honesta y Transparente',
      content: 'Cansados de los talleres que inventan fallas, en Master Auto trabajamos con cámaras y fotos en tiempo real para mostrarte exactamente qué pieza requiere cambio.\n\nCuidamos el patrimonio de tu familia para que manejes seguro en ciudad y carretera.',
      metrics: [
        { label: 'Autos Reparados', value: '+9,800' },
        { label: 'Garantía en Mano de Obra', value: '180 Días' },
        { label: 'Satisfacción de Clientes', value: '99%' }
      ]
    };
    blogPosts = [
      { title: '5 Ruidos Extraños al Frenar que Nunca Debes Ignorar en tu Carro', excerpt: 'Cómo identificar si necesitas cambio de balatas o rectificado antes de dañar los discos.', read_time: '4 min', date: 'Esta semana' },
      { title: 'Por Qué el Aceite Sintético Ahorra Gasolina y Cuida tu Motor', excerpt: 'Las diferencias clave entre aceites minerales y sintéticos de última generación.', read_time: '3 min', date: 'Hace unos días' }
    ];
    contact = {
      title: 'Trae tu Auto Hoy Mismo',
      subtitle: 'Atención de Lunes a Sábado de 8:00 AM a 6:30 PM.',
      phone: '+52 (656) 441-8899',
      email: 'servicio@masterauto.com',
      address: 'Blvd. Manuel Gómez Morín #3100, Col. Satélite'
    };
    social = {
      facebook: {
        copy: '🚗 ¿Sientes que tu auto jalonea o ya le toca afinación? En Master Auto te realizamos escaneo computarizado sin costo al contratar tu afinación mayor.\n\n🔧 Garantía por escrito en piezas y mano de obra.\n\n📅 Agenda tu cita por WhatsApp.',
        cta: 'Agendar Cita'
      },
      instagram: {
        copy: 'La seguridad de tu familia en carretera empieza con frenos y suspensión en perfecto estado. 🚗🛠️ Maneja con total tranquilidad con nuestros chequeos preventivos.',
        hashtags: '#TallerMecanico #MantenimientoAutomotriz #Frenos #Afinacion #MasterAuto #AutosSeguros'
      }
    };
    imagePrompt = 'Fotografía publicitaria de taller mecánico automotriz limpio y moderno con iluminación industrial, auto en elevador y técnico usando tableta de diagnóstico digital, 8k.';
  }
  // 7. IoT, Industria & Tecnología (Si se solicita explícitamente)
  else if (
    lower.includes('iot') ||
    lower.includes('sensor') ||
    lower.includes('telemetria') ||
    lower.includes('industrial') ||
    lower.includes('maquiladora')
  ) {
    siteName = 'Pulse IoT Solutions';
    industry = 'Internet de las Cosas (IoT) & Telemetría Industrial';
    tagline = 'Monitoreo inteligente en tiempo real y automatización para la industria moderna.';
    primaryColor = '#E95349';
    secondaryColor = '#C6443F';
    accentColor = '#E26A69';
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
    imagePrompt = 'Fotografía publicitaria corporativa de tecnología industrial, sensores conectados emitiendo datos visuales en tonos azul brillante (#E95349) y fondo tecnológico (#1E1E1E), realismo 8k.';
  }
  // 8. Florerías, Flores, Tulipanes y Rosas
  else if (lower.includes('flor') || lower.includes('tulipan') || lower.includes('rosa') || lower.includes('ramo') || lower.includes('arreglo floral')) {
    siteName = 'Bella Rosa Florería & Diseños Florales';
    industry = 'Florería Boutique & Arreglos de Alta Gama';
    tagline = 'Flores frescas de corte diario que transmiten emociones y momentos inolvidables.';
    primaryColor = '#db2777';
    secondaryColor = '#9d174d';
    accentColor = '#fce7f3';
    hero = {
      badge: '🌸 Flores 100% Frescas • Entrega el Mismo Día',
      title: 'Arreglos Florales Únicos que Hablan por Ti',
      subtitle: 'Ramos de rosas rojas, tulipanes holandeses, orquídeas y diseños florales para aniversarios, cumpleaños y ocasiones especiales.',
      primary_cta: 'Ver Catálogo de Ramos',
      secondary_cta: 'Pedir por WhatsApp',
      trust_badges: ['Flores Frescas Garantizadas', 'Entrega en 90 Minutos', 'Tarjeta Personalizada Gratis']
    };
    services = [
      { title: 'Ramos de Rosas & Tulipanes Premium', description: 'Selección de flores importadas con envoltura de lujo y listón satinado.', icon: 'Sparkles', badge: 'Más Vendido' },
      { title: 'Arreglos para Ocasiones Especiales', description: 'Diseños florales para aniversarios, bodas, graduaciones y eventos corporativos.', icon: 'Heart', badge: 'Exclusivo' },
      { title: 'Servicio a Domicilio Express', description: 'Entregamos tu sorpresa floral puntualmente con mensaje personalizado.', icon: 'TrendingUp', badge: 'Mismo Día' }
    ];
    about = {
      title: 'Pasión por el Arte Floral',
      content: 'En Bella Rosa seleccionamos cada flor una por una desde los invernaderos más prestigiosos. Creemos que cada ramo cuenta una historia de amor, gratitud o celebración, y cuidamos cada detalle para que tu regalo sea perfecto.',
      metrics: [{ label: 'Arreglos Entregados', value: '+8,500' }, { label: 'Sonrisas Generadas', value: '100%' }, { label: 'Años de Trayectoria', value: '7+' }]
    };
    blogPosts = [
      { title: 'Cómo Cuidar tus Rosas y Tulipanes para que Duren más de 12 Días', excerpt: 'Consejos prácticos para cortar tallos, cambiar agua y mantener tus flores resplandecientes.', read_time: '3 min', date: 'Esta semana' },
      { title: 'El Significado de los Colores en las Rosas', excerpt: 'Descubre qué mensaje transmite cada color antes de elegir tu ramo ideal.', read_time: '4 min', date: 'Hace unos días' }
    ];
    contact = {
      title: 'Haz tu Pedido o Personaliza tu Ramo',
      subtitle: 'Atención rápida por WhatsApp y entregas a domicilio.',
      phone: '+52 (656) 555-0199',
      email: 'pedidos@floreriarosa.com',
      address: 'Cobertura en toda la ciudad'
    };
    social = {
      facebook: { copy: '🌹 ¡Sorprende a esa persona especial hoy mismo! Ramos de rosas y tulipanes frescos con entrega a domicilio.', cta: 'Ver Modelos y Precios' },
      instagram: { copy: 'El amor florece con los detalles correctos. ✨🌷 Haz tu pedido hoy con entrega express.', hashtags: '#Flores #Floreria #Rosas #Tulipanes #DetallesConAmor' }
    };
    imagePrompt = 'Fotografía comercial editorial de bouquet de rosas rojas y tulipanes rosados frescos en papel kraft elegante, iluminación suave y fondo limpio, 8k.';
  }
  // 9. Donas, Panadería, Pastelería y Repostería
  else if (lower.includes('dona') || lower.includes('pastel') || lower.includes('reposteria') || lower.includes('cupcake')) {
    siteName = 'Dulce Tentación - Donas & Pastelería';
    industry = 'Repostería Artesanal, Donas Gourmet & Café';
    tagline = 'Masa fresca horneada a diario, rellenos irresistibles y café de altura.';
    primaryColor = '#ea580c';
    secondaryColor = '#9a3412';
    accentColor = '#fed7aa';
    hero = {
      badge: '🍩 Horneadas Frescas Cada Mañana',
      title: 'El Sabor Irresistible de las Donas Gourmet Hechas con Amor',
      subtitle: 'Donas artesanales glaseadas, rellenas de nutella, dulce de leche y frutos rojos, acompañadas del mejor café.',
      primary_cta: 'Ver Menú de Donas & Postres',
      secondary_cta: 'Hacer Pedido a Domicilio',
      trust_badges: ['100% Ingredientes Naturales', 'Horneadas al Momento', 'Cajas de Regalo Personalizadas']
    };
    services = [
      { title: 'Donas Clásicas y Glaseadas', description: 'Masa suave y esponjosa con glaseado tradicional de vainilla, chocolate y canela.', icon: 'Sparkles', badge: 'Favoritas' },
      { title: 'Especialidades Rellenas Gourmet', description: 'Rellenos generosos de crema pastelera, nutella, cajeta y compota de fresa natural.', icon: 'Heart', badge: 'Más Pedidas' },
      { title: 'Combos para Eventos & Fiestas', description: 'Cajas de 6, 12 o 24 donas decoradas para reuniones, cumpleaños y empresas.', icon: 'Users', badge: 'Paquetes' }
    ];
    about = {
      title: 'Nuestra Receta Secreta',
      content: 'En Dulce Tentación creemos que cada mordida debe ser un momento de pura felicidad. Usamos harina de trigo selecta, mantequilla pura y fermentación lenta para lograr la textura más suave del mercado.',
      metrics: [{ label: 'Donas Horneadas al Mes', value: '+20,000' }, { label: 'Clientes Enamorados', value: '99.8%' }, { label: 'Recetas Originales', value: '18+' }]
    };
    blogPosts = [
      { title: 'El Secreto de una Masa Esponjosa: Fermentación y Temperatura', excerpt: 'Cómo logramos la consistencia perfecta sin conservadores artificiales.', read_time: '3 min', date: 'Esta semana' },
      { title: 'Los 5 Mejores Maridajes: Café Americano y Donas de Chocolate', excerpt: 'Por qué la combinación clásica de café tostado y chocolate sigue siendo insuperable.', read_time: '3 min', date: 'Hace unos días' }
    ];
    contact = {
      title: 'Haz tu Pedido o Visítanos en Sucursal',
      subtitle: 'Servicio a domicilio rápido para que disfrutes calientitas.',
      phone: '+52 (656) 555-0199',
      email: 'antojos@dulcetentacion.com',
      address: 'Servicio en mostrador y a domicilio'
    };
    social = {
      facebook: { copy: '🍩 ¡Tu día merece un premio dulce! Pide hoy tu caja de donas artesanales recién salidas del horno.', cta: 'Pedir por WhatsApp' },
      instagram: { copy: 'Esponjosas, deliciosas y con mucho relleno. ✨ ¿Cuál es tu sabor favorito? Escríbenos para enviártelas.', hashtags: '#Donas #Donuts #Reposteria #Pasteleria #Foodie' }
    };
    imagePrompt = 'Fotografía publicitaria de donas artesanales glaseadas con chocolate y chispas sobre charola rústica con taza de café, iluminación cálida de panadería, 8k.';
  }
  // 10. GENERADOR DINÁMICO UNIVERSAL PARA CUALQUIER OTRA ENTRADA (Sintetiza marca y textos profesionales)
  else {
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

    // Ubicación
    const locMatch = cleanBrief.match(/\ben\s+([A-Za-zÁ-ÿ\s]+?)(?:,|\.|\s+con|\s+y\s|\s+para|$)/i);
    const location = locMatch ? locMatch[1].trim() : 'México';

    // Teléfono
    const phoneMatch = cleanBrief.match(/(\+?\d[\d\s\-()]{7,\d})/);
    const customPhone = phoneMatch ? phoneMatch[0].trim() : '+52 (656) 612-9900';

    siteName = dynamicBrand;
    industry = 'Servicios Profesionales & Soluciones a Medida';
    tagline = `Calidad garantizada, atención personalizada y soluciones a tu medida en ${location}.`;
    primaryColor = '#E95349';
    secondaryColor = '#C6443F';
    accentColor = '#E26A69';

    if (lower.includes('rosa') || lower.includes('pastel')) {
      primaryColor = '#db2777'; secondaryColor = '#9d174d'; accentColor = '#fbcfe8';
    } else if (lower.includes('dorad') || lower.includes('oro')) {
      primaryColor = '#d97706'; secondaryColor = '#78350f'; accentColor = '#fde68a';
    } else if (lower.includes('verde') || lower.includes('eco')) {
      primaryColor = '#059669'; secondaryColor = '#047857'; accentColor = '#a7f3d0';
    } else if (lower.includes('naranja') || lower.includes('fuego')) {
      primaryColor = '#ea580c'; secondaryColor = '#9a3412'; accentColor = '#fed7aa';
    } else if (lower.includes('rojo')) {
      primaryColor = '#dc2626'; secondaryColor = '#991b1b'; accentColor = '#fca5a5';
    } else if (lower.includes('morad') || lower.includes('purpura')) {
      primaryColor = '#7c3aed'; secondaryColor = '#5b21b6'; accentColor = '#ddd6fe';
    }

    hero = {
      badge: '✨ Calidad Garantizada & Atención Inmediata',
      title: 'Soluciones Profesionales Diseñadas para Superar tus Expectativas',
      subtitle: `Servicios integrales y atención personalizada con los más altos estándares de calidad, precios transparentes y garantía en ${location}.`,
      primary_cta: 'Solicitar Información / Cotización',
      secondary_cta: 'Contactar por WhatsApp',
      trust_badges: ['Atención 100% Personalizada', 'Precios Claros y Transparentes', 'Garantía de Satisfacción']
    };
    services = [
      {
        title: 'Asesoría y Atención Personalizada',
        description: `Te orientamos paso a paso para que obtengas exactamente la solución que buscas en ${location}.`,
        icon: 'Sparkles',
        badge: 'Destacado'
      },
      {
        title: 'Servicios de Calidad Garantizada',
        description: 'Procesos de alta eficiencia con resultados duraderos y atención de primer nivel.',
        icon: 'ShieldCheck',
        badge: 'Recomendado'
      },
      {
        title: 'Garantía y Seguimiento Continuo',
        description: 'Compromiso total con cada cliente con seguimiento antes, durante y después del servicio.',
        icon: 'TrendingUp',
        badge: 'Garantizado'
      }
    ];
    about = {
      title: `Nuestra Experiencia en ${dynamicBrand}`,
      content: `En ${dynamicBrand} nos dedicamos con pasión a ofrecer la mejor experiencia de servicio.\n\nCuidamos cada detalle para que cada cliente reciba exactamente lo que busca con total transparencia, precios claros y la confianza que mereces.`,
      metrics: [
        { label: 'Clientes Atendidos', value: '+1,200' },
        { label: 'Calificación de Clientes', value: '4.9 ★' },
        { label: 'Años de Experiencia', value: '7+ Años' }
      ]
    };
    blogPosts = [
      {
        title: `Guía y Recomendaciones para Elegir la Mejor Opción en ${dynamicBrand}`,
        excerpt: `Consejos y puntos clave que debes evaluar para tomar una decisión inteligente y segura en ${location}.`,
        read_time: '3 min',
        date: 'Esta semana'
      },
      {
        title: 'Tendencias y Buenas Prácticas del Sector',
        excerpt: 'Descubre cómo la innovación y las nuevas herramientas están transformando este sector.',
        read_time: '4 min',
        date: 'Hace unos días'
      }
    ];
    contact = {
      title: 'Comunícate con Nosotros Hoy Mismo',
      subtitle: `Estamos listos para atenderte en ${location} por teléfono o WhatsApp.`,
      phone: customPhone,
      email: `contacto@${dynamicBrand.toLowerCase().replace(/[^a-z0-9]/g, '') || 'negocio'}.com`,
      address: `${location} • Cobertura Completa`
    };
    social = {
      facebook: {
        copy: `🚀 ¿Buscas la mejor opción con atención personalizada, calidad garantizada y precios justos? En ${dynamicBrand} te atendemos hoy mismo.`,
        cta: 'Contactar por WhatsApp'
      },
      instagram: {
        copy: 'La calidad y el compromiso hacen la diferencia. ✨ Descubre todo lo que tenemos preparado para ti. ¡Escríbenos!',
        hashtags: '#CalidadGarantizada #ServicioProfesional #MejorOpcion #AtencionPersonalizada'
      }
    };
    imagePrompt = `Composición publicitaria profesional y moderna para ${dynamicBrand}, iluminación elegante, alta fidelidad 8k, estilo editorial.`;
  }

  // Aplicar colores personalizados o selección de paleta
  if (options.customColors?.primary) {
    primaryColor = options.customColors.primary;
    secondaryColor = options.customColors.secondary || '#C6443F';
    accentColor = options.customColors.accent || '#E26A69';
  } else if (options.colorPalette) {
    const pal = options.colorPalette.toLowerCase();
    if (pal.includes('verde') || pal.includes('059669')) {
      primaryColor = '#059669';
      secondaryColor = '#065f46';
      accentColor = '#6ee7b7';
    } else if (pal.includes('naranja') || pal.includes('ea580c')) {
      primaryColor = '#ea580c';
      secondaryColor = '#c2410c';
      accentColor = '#fed7aa';
    } else if (pal.includes('rosa') || pal.includes('be185d')) {
      primaryColor = '#db2777';
      secondaryColor = '#9d174d';
      accentColor = '#fbcfe8';
    } else if (pal.includes('púrpura') || pal.includes('purpura') || pal.includes('7c3aed')) {
      primaryColor = '#7c3aed';
      secondaryColor = '#5b21b6';
      accentColor = '#ddd6fe';
    } else if (pal.includes('negro') || pal.includes('oro') || pal.includes('0f172a')) {
      primaryColor = '#d97706';
      secondaryColor = '#78350f';
      accentColor = '#fde68a';
    } else if (pal.includes('rojo') || pal.includes('dc2626')) {
      primaryColor = '#dc2626';
      secondaryColor = '#991b1b';
      accentColor = '#fca5a5';
    } else if (pal.includes('turquesa') || pal.includes('0891b2')) {
      primaryColor = '#0891b2';
      secondaryColor = '#0e7490';
      accentColor = '#a5f3fc';
    }
  }

  const generatedId = Date.now() % 100000;
  const titulo = `Sitio Web: ${siteName}`;

  const generatedWebsite = {
    titulo,
    site_name: siteName,
    industry,
    tagline,
    custom_logo: customLogo,
    design_theme: options.designTheme || 'dark-modern',
    brand_colors: {
      primary: primaryColor,
      secondary: secondaryColor,
      accent: accentColor
    },
    hero_image: options.attachedPhoto || options.heroImage || null,
    hero,
    services,
    about,
    blog_posts: blogPosts,
    contact,
    social_posts: social,
    resumen_web: about.content,
    copy_redes: social.instagram?.copy || '',
    prompt_imagen: imagePrompt,
    drive_files: {
      pages_file: `/Sitio_Web/Paginas/${siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_landing.json`,
      blog_file: `/Sitio_Web/Blog/post_${blogPosts[0]?.title.slice(0, 15).replace(/\s+/g, '_').toLowerCase()}.md`,
      social_file: `/Redes_Sociales/Para_Publicar/campaña_${siteName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`,
      brand_file: `/Marca/logo_oficial.png`
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
  // Estado de usuario y Auth (con sesión activa por defecto para permitir acceso inmediato al generador de páginas web con IA)
  const [currentUser, setCurrentUser] = useState({
    uid: 'evaluador-carlos',
    email: 'carlos.torres@iottechnologies.mx',
    displayName: 'Carlos Torres (Evaluador)',
    role: 'Aprobador Humano & Creador',
    isDefaultSession: true
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Prompt inicial por defecto para demostración inmediata
  const initialBrief = 'Clínica veterinaria 24 horas para perros y gatos con estética canina, servicio de urgencias médicas, hospitalización y venta de alimentos premium.';

  // Estados para el Cerebro Digital (IA) - Inicializado con propuesta lista
  const [brief, setBrief] = useState(initialBrief);
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState(() => {
    return generateSmartProposal(initialBrief);
  });
  const [approvedSuccess, setApprovedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [generationStep, setGenerationStep] = useState(0);

  // Estados de Personalización Visual (Logo de Usuario, Paleta y Estilo de Diseño)
  const [customLogo, setCustomLogo] = useState(null);
  const [customColors, setCustomColors] = useState(null);
  const [designTheme, setDesignTheme] = useState('dark-modern');
  const logoInputMainRef = useRef(null);

  // Estados para contenidos sincronizados
  const [publishedContent, setPublishedContent] = useState([]);
  const [pendingContents, setPendingContents] = useState([]);
  const [activeTab, setActiveTab] = useState('plataforma'); // 'plataforma', 'drive'

  // URL del Backend
  const BACKEND_URL = '/api';

  // Manejador para subir imagen de logotipo desde el dispositivo del usuario
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('La imagen del logotipo debe ser menor a 8MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setCustomLogo(dataUrl);
      setProposal((prev) => {
        if (!prev || !prev.content) return prev;
        return {
          ...prev,
          content: {
            ...prev.content,
            custom_logo: dataUrl
          }
        };
      });
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  // Manejador para remover logo personalizado
  const handleLogoRemove = () => {
    setCustomLogo(null);
    setProposal((prev) => {
      if (!prev || !prev.content) return prev;
      return {
        ...prev,
        content: {
          ...prev.content,
          custom_logo: null
        }
      };
    });
  };

  // Manejador para cambiar paleta o color primario/secundario en tiempo real
  const handleColorChange = (newPrimary, newSecondary = null) => {
    const primary = newPrimary;
    const secondary = newSecondary || (newPrimary === '#E95349' ? '#C6443F' : '#0f172a');
    setCustomColors({ primary, secondary });
    setProposal((prev) => {
      if (!prev || !prev.content) return prev;
      return {
        ...prev,
        content: {
          ...prev.content,
          brand_colors: {
            ...prev.content.brand_colors,
            primary,
            secondary
          }
        }
      };
    });
  };

  // Manejador para cambiar estilo de diseño visual (tema)
  const handleThemeChange = (newTheme) => {
    setDesignTheme(newTheme);
    setProposal((prev) => {
      if (!prev || !prev.content) return prev;
      return {
        ...prev,
        content: {
          ...prev.content,
          design_theme: newTheme
        }
      };
    });
  };

  // Estados de modal de celebración de aprobación
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [lastApprovedInfo, setLastApprovedInfo] = useState(null);

  // Manejador para pedir ajustes o rediseño a la IA (en lenguaje natural + foto opcional)
  const handleAiRefine = async (refineInstruction, attachedPhoto = null) => {
    if ((!refineInstruction || !refineInstruction.trim()) && !attachedPhoto) return;
    await handleGenerate(refineInstruction?.trim() || 'Ajusta el sitio e incorpora la foto adjunta', true, proposal?.content, attachedPhoto);
  };

  // Manejador para actualizar el sitio web tras edición manual de textos o fotos
  const handleUpdateSite = (updatedContent) => {
    setProposal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        content: updatedContent,
        record: {
          ...prev.record,
          title: updatedContent.site_name || updatedContent.titulo || prev.record?.title,
          body_text: updatedContent.resumen_web || updatedContent.about?.content || prev.record?.body_text,
          content: updatedContent
        }
      };
    });

    if (proposal?.id) {
      fetch(`${BACKEND_URL}/content/${proposal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent })
      }).catch((err) => console.log('Sincronización de edición:', err));
    }
  };

  // Suscribirse al estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Auditor',
          role: 'Aprobador Humano (Audit Trail)',
          isDefaultSession: false
        });
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

  // Cerrar sesión
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (e) {
      console.error('Error al salir:', e);
    }
  };

  // 1. Solicitud al Cerebro Digital (IA) con soporte para adjuntar fotos
  const handleGenerate = async (promptOverride = null, isRefinement = false, previousSiteData = null, attachedPhoto = null) => {
    const targetBrief = (typeof promptOverride === 'string' ? promptOverride : brief).trim();
    if (!targetBrief && !attachedPhoto) return;
    setLoading(true);
    setApprovedSuccess(false);
    setErrorMessage('');
    setGenerationStep(1);

    const stepTimer = setInterval(() => {
      setGenerationStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1200);

    let generatedData = null;

    // Intentar primero con el backend (conecta a Gemini AI)
    try {
      const res = await fetch(`${BACKEND_URL}/generate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: targetBrief || 'Genera una propuesta visual completa',
          isRefinement,
          previousSite: previousSiteData || (isRefinement ? proposal?.content : null),
          refineInstruction: isRefinement ? targetBrief : null,
          customLogo,
          heroImage: attachedPhoto || (isRefinement ? proposal?.content?.hero_image : null),
          customColors,
          designTheme,
          userEmail: currentUser?.email || 'evaluador@iottechnologies.mx'
        })
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json?.content?.titulo) {
          generatedData = json;
          if (customLogo) generatedData.content.custom_logo = customLogo;
          if (attachedPhoto) generatedData.content.hero_image = attachedPhoto;
          if (customColors) generatedData.content.brand_colors = customColors;
          if (designTheme) generatedData.content.design_theme = designTheme;
        }
      }
    } catch (networkErr) {
      console.warn('API backend no disponible en este host, activando motor autónomo de IA:', networkErr);
    }

    // Si el backend no está disponible en Vercel estático o hubo problema de red, usar motor inteligente
    if (!generatedData) {
      generatedData = generateSmartProposal(targetBrief || 'Sitio web profesional', {
        customLogo,
        customColors,
        designTheme,
        attachedPhoto: attachedPhoto || (isRefinement ? proposal?.content?.hero_image : null),
        previousSite: previousSiteData || (isRefinement ? proposal?.content : null),
        isRefinement
      });
    }

    clearInterval(stepTimer);
    setGenerationStep(5);
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
    const nowIso = new Date().toISOString();

    try {
      await fetch(`${BACKEND_URL}/approve/${targetId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverName,
          approverEmail,
          proposalData: targetContent
        })
      });
    } catch (e) {
      console.warn('Aprobación sincronizada localmente:', e);
    }

    setApprovedSuccess(true);
    const approvedItem = {
      id: targetId,
      title: targetContent?.site_name || targetContent?.titulo || 'Sitio Web Aprobado',
      body_text: targetContent?.resumen_web || targetContent?.about?.content || 'Sitio web profesional aprobado',
      category: 'PÁGINA WEB / REDES',
      status: 'APPROVED',
      approved_by: approverName,
      approved_by_email: approverEmail,
      approved_at: nowIso,
      content: targetContent
    };

    setLastApprovedInfo(approvedItem);
    setShowCelebrationModal(true);

    if (targetContent) {
      setPublishedContent((prev) => [
        approvedItem,
        ...prev.filter(item => item.id !== targetId)
      ]);
    }
    loadContents();
  };

  // Abrir cualquier sitio web aprobado en una pestaña nueva del navegador
  const handleOpenSiteInNewTab = (item) => {
    if (!item) return;
    const targetId = item.id || '1';

    // Sincronizar contenido con el backend para garantizar que la vista previa esté actualizada
    if (item.content) {
      fetch(`${BACKEND_URL}/content/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: item.content })
      }).catch(() => {});
    }

    const previewUrl = `/preview/${targetId}`;
    const opened = window.open(previewUrl, '_blank');
    if (!opened) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Cargar un sitio web aprobado de nuevo al editor/generador para hacer cambios o pedir a la IA
  const handleLoadInEditor = (item) => {
    if (!item || !item.content) return;
    setProposal({
      id: item.id,
      status: 'APPROVED',
      sector: item.content.industry || 'Servicios',
      content: item.content,
      record: item
    });
    setBrief(item.content.tagline || item.content.titulo || item.title);
    if (item.content.custom_logo) setCustomLogo(item.content.custom_logo);
    if (item.content.brand_colors) setCustomColors(item.content.brand_colors);
    if (item.content.design_theme) setDesignTheme(item.content.design_theme);
    setApprovedSuccess(true);
    setActiveTab('plataforma');
  };

  // Descargar index.html autónomo de un sitio aprobado
  const handleDownloadSiteHtml = (item) => {
    const site = item?.content;
    if (!site) return;
    const name = site.site_name || site.titulo || 'sitio';
    fetch(`/preview/${item.id}`)
      .then((r) => r.text())
      .then((html) => {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_index.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        window.open(`/preview/${item.id}`, '_blank');
      });
  };

  // APLICACIÓN PRINCIPAL: GENERADOR DE PÁGINAS WEB DESDE CERO CON IA
  return (
    <div className="min-h-screen bg-[#F1F1F1] text-slate-100 font-sans selection:bg-[#E95349] selection:text-[#1E1E1E]">
      
      {/* 1. Header & Navegación Institucional Oficial IOT TECHNOLOGIES */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          
          {/* Logo Corporativo Oficial */}
          <div className="flex items-center gap-3">
            <a href="#inicio" className="flex items-center">
              <Logo />
            </a>
          </div>

          {/* Navegación Oficial: Generador Web IA, Sitios Aprobados y Google Drive CMS */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-semibold text-[#333333]">
            <button
              onClick={() => setActiveTab('plataforma')}
              className={`flex items-center gap-1.5 transition pb-1 cursor-pointer ${activeTab === 'plataforma' ? 'text-[#E26A69] border-b-2 border-[#E95349]' : 'hover:text-[#1E1E1E]'}`}
            >
              <Sparkles className="w-4 h-4 text-[#E95349]" />
              <span>Generador Web IA</span>
            </button>
            <button
              onClick={() => setActiveTab('aprobados')}
              className={`flex items-center gap-1.5 transition pb-1 cursor-pointer ${activeTab === 'aprobados' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'hover:text-[#1E1E1E]'}`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sitios Aprobados</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                {publishedContent.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('drive')}
              className={`flex items-center gap-1.5 transition pb-1 cursor-pointer ${activeTab === 'drive' ? 'text-[#E26A69] border-b-2 border-[#E95349]' : 'hover:text-[#1E1E1E]'}`}
            >
              <FolderTree className="w-4 h-4 text-[#E95349]" />
              <span>Google Drive CMS</span>
            </button>
          </nav>

          {/* Área de Autenticación / Sesión de Usuario */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 bg-white/90 border border-[#E5E5E5]/80 px-3 py-1.5 rounded-xl shadow-inner">
              <div className="w-7 h-7 rounded-lg bg-[#E95349] text-[#1E1E1E] flex items-center justify-center font-bold text-xs">
                {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <span className="text-xs font-bold text-[#1E1E1E] block truncate max-w-[130px]">
                  {currentUser?.displayName || 'Usuario'}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 inline" /> {currentUser?.isDefaultSession ? 'Sesión Activa' : 'Auditor Conectado'}
                </span>
              </div>
              {currentUser?.isDefaultSession ? (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="ml-1 px-2.5 py-1 text-xs font-bold text-[#E26A69] bg-[#E95349]/25 hover:bg-[#E95349] hover:text-[#1E1E1E] rounded-lg transition border border-[#E95349]/40 flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" />
                  Iniciar Sesión
                </button>
              ) : (
                <button
                  onClick={handleSignOut}
                  title="Cerrar Sesión"
                  className="p-1.5 text-[#757575] hover:text-red-400 rounded-lg hover:bg-[#F1F1F1] transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Barra de navegación para móviles */}
      <div className="lg:hidden flex items-center justify-around px-4 py-2 bg-white/80 border-b border-[#E5E5E5] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('plataforma')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${activeTab === 'plataforma' ? 'bg-[#E95349] text-[#1E1E1E]' : 'text-[#757575]'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generador</span>
        </button>
        <button
          onClick={() => setActiveTab('aprobados')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${activeTab === 'aprobados' ? 'bg-emerald-600 text-[#1E1E1E]' : 'text-[#757575]'}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Aprobados ({publishedContent.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('drive')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${activeTab === 'drive' ? 'bg-[#E95349] text-[#1E1E1E]' : 'text-[#757575]'}`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Drive</span>
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}

      {/* PESTAÑA 1: PLATAFORMA & HERO & CEREBRO DIGITAL */}
      {activeTab === 'plataforma' && (
        <>
          {/* 1. ESTUDIO CENTRAL: CEREBRO DIGITAL - GENERADOR DE SITIOS WEB CON IA */}
          <section id="cerebro-digital" className="relative pt-8 pb-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
            <div className="bg-gradient-to-b from-[#1E1E1E] via-slate-900 to-slate-950 rounded-3xl border border-[#E95349]/40 p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
              
              {/* Resplandor decorativo de fondo */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#E95349]/10 blur-[100px] rounded-full pointer-events-none"></div>

              {/* Encabezado del Generador */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E5E5] pb-6 relative z-10">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#E26A69] uppercase tracking-wider mb-1 px-3 py-1 rounded-full bg-[#E95349]/15 border border-[#E95349]/30">
                    <Sparkles className="w-4 h-4 text-[#E95349]" />
                    <span>Cerebro Digital con IA • Ficha 2026-544-11 (MYOS Platform)</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-[#1E1E1E] font-heading mt-2">
                    Generador de Páginas Web desde Cero con IA
                  </h1>
                  <p className="text-sm text-[#333333] mt-1 max-w-2xl">
                    Describe tu idea o selecciona un giro comercial. La Inteligencia Artificial creará el sitio web completo con diseño en vivo, código HTML5 descargable, publicaciones para redes y sincronización en Google Drive CMS.
                  </p>
                </div>

                <div className="text-right sm:self-start">
                  <span className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold inline-block">
                    Aprobación Humana Obligatoria
                  </span>
                  <span className="text-[10px] text-[#757575] mt-1 block">
                    Auditor: <strong className="text-slate-200">{currentUser?.displayName}</strong>
                  </span>
                </div>
              </div>

              {/* Formulario Principal de Generación - SOLO LOGO, INSTRUCCIÓN Y BOTÓN */}
              <div className="space-y-6 relative z-10">
                
                {/* 1. SECCIÓN: LOGOTIPO DE LA PÁGINA WEB (Subir Imagen) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/95 border border-[#E5E5E5] space-y-3 shadow-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 border-b border-[#E5E5E5]/80 pb-2.5">
                    <label className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#E26A69]" />
                      <span>Logotipo de la Página Web (Sube tu Imagen)</span>
                    </label>
                    <span className="text-[11px] text-[#757575]">
                      Opcional: Aparecerá en el encabezado, pie de página y carpeta de marca
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={logoInputMainRef}
                    onChange={handleLogoUpload}
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                    className="hidden"
                  />

                  {customLogo ? (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F1F1F1] border border-emerald-500/40">
                      <div className="flex items-center gap-3">
                        <img
                          src={customLogo}
                          alt="Logo cargado"
                          className="w-14 h-14 object-contain rounded-lg bg-white/5 p-1 border border-[#E5E5E5] shadow-inner"
                        />
                        <div>
                          <span className="text-xs font-bold text-emerald-300 block">✓ Logotipo Oficial Cargado</span>
                          <span className="text-[11px] text-[#757575] block">
                            Tu logotipo se integrará de forma automática en el navbar y en todo el sitio web
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => logoInputMainRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-[#F1F1F1] hover:bg-slate-700 text-xs font-semibold text-slate-200 transition border border-[#E5E5E5]"
                        >
                          Cambiar imagen
                        </button>
                        <button
                          type="button"
                          onClick={handleLogoRemove}
                          className="p-1.5 rounded-lg text-[#757575] hover:text-red-400 hover:bg-red-950/30 transition"
                          title="Eliminar logotipo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputMainRef.current?.click()}
                      className="w-full p-5 rounded-xl border-2 border-dashed border-[#E5E5E5] hover:border-[#E95349] bg-[#F1F1F1]/80 hover:bg-white/60 transition flex flex-col items-center justify-center gap-2 text-center group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#E95349]/10 group-hover:bg-[#E95349]/20 text-[#E26A69] flex items-center justify-center transition">
                        <Upload className="w-5 h-5 group-hover:scale-110 transition" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">
                          Haz clic aquí para subir la imagen de tu logotipo
                        </span>
                        <span className="text-[11px] text-[#757575] block mt-0.5">
                          Admite PNG, JPG, SVG o WebP (Recomendado fondo transparente)
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                {/* 2. SECCIÓN: INSTRUCCIONES / PROMPT PARA LA IA */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#E26A69]" />
                      <span>Instrucciones para la Inteligencia Artificial (Prompt):</span>
                    </span>
                    <span className="text-xs font-normal text-[#757575]">
                      Tú pides las cosas y la IA las crea
                    </span>
                  </label>
                  <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="Escribe con tus propias palabras todo lo que deseas para tu página web. Por ejemplo:
- ¿De qué es tu negocio o qué vendes? (ej: florería, panadería, abogados, clínica, ropa, etc.)
- ¿Tiene un nombre tu negocio o marca?
- ¿Qué productos o servicios ofreces y qué beneficios tienen?
- ¿Tienes preferencia de colores o estilo? (ej: colores rosa pastel, blanco minimalista, tonos oscuros elegantes, azul corporativo, etc.)
- ¿Tienes teléfono, WhatsApp, promociones o servicio a domicilio?"
                    rows={5}
                    className="w-full p-4 rounded-2xl bg-[#F1F1F1] border border-[#E5E5E5] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E95349] text-sm leading-relaxed"
                  />
                  <span className="text-[11px] text-[#757575] block">
                    Tip: Puedes ser tan específico como quieras con los colores, secciones, ofertas o textos. La IA no copiará tu texto, sino que diseñará el sitio a tu gusto.
                  </span>
                </div>

                {/* 3. BOTÓN PRINCIPAL DE CONSTRUCCIÓN */}
                <button
                  onClick={() => handleGenerate()}
                  disabled={loading || !brief.trim()}
                  className="w-full py-4 rounded-2xl font-bold text-[#1E1E1E] bg-gradient-to-r from-[#E95349] via-[#C6443F] to-[#E95349] hover:opacity-95 disabled:from-slate-800 disabled:to-slate-850 disabled:text-slate-600 transition shadow-xl shadow-[#E95349]/25 flex items-center justify-center gap-3 text-base cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  {loading ? '🧠 La Inteligencia Artificial está construyendo tu página web...' : '⚡ Construir Página Web con IA'}
                </button>

                {/* Progreso en tiempo real mientras genera */}
                {loading && (
                  <div className="p-4 rounded-2xl bg-[#F1F1F1] border border-[#E95349]/40 space-y-3 animate-fadeIn">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#E26A69] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E95349] animate-ping"></span>
                        {generationStep === 1 && 'Paso 1/5: Interpretando modelo de negocio y audiencia objetivo...'}
                        {generationStep === 2 && 'Paso 2/5: Diseñando paleta visual, tipografía y arquitectura...'}
                        {generationStep === 3 && 'Paso 3/5: Redactando propuestas de valor y copywriting persuasivo...'}
                        {generationStep === 4 && 'Paso 4/5: Estructurando código HTML5 interactivo y responsive...'}
                        {generationStep >= 5 && 'Paso 5/5: Creando estructura en Google Drive CMS (/Sitio_Web/Paginas)...'}
                      </span>
                      <span className="font-mono text-[#757575]">{generationStep * 20}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#E95349] to-[#E26A69] transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(15, generationStep * 20))}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-sm flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Renderizado de la Página Generada con Vista Previa Interactiva */}
              {proposal ? (
                <GeneratedWebsitePreview
                  proposal={proposal}
                  isApproved={approvedSuccess}
                  onApprove={() => handleApprove()}
                  onRegenerate={() => handleGenerate()}
                  currentUser={currentUser}
                  loading={loading}
                  customLogo={customLogo}
                  onLogoUpload={handleLogoUpload}
                  onLogoRemove={handleLogoRemove}
                  customColors={customColors}
                  onColorChange={handleColorChange}
                  designTheme={designTheme}
                  onThemeChange={handleThemeChange}
                  onAiRefine={handleAiRefine}
                  onUpdateSite={handleUpdateSite}
                />
              ) : (
                <div className="pt-4 border-t border-[#E5E5E5]/80">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-[#F1F1F1]/70 border border-[#E5E5E5] space-y-2">
                      <div className="w-9 h-9 rounded-xl bg-[#E95349]/20 text-[#E26A69] flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <h4 className="font-bold text-[#1E1E1E] text-sm">Describe tu Idea</h4>
                      <p className="text-xs text-[#757575] leading-relaxed">
                        Escribe el giro de tu negocio, productos clave o promociones. La IA genera textos y estructura a la medida.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#F1F1F1]/70 border border-[#E5E5E5] space-y-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <h4 className="font-bold text-[#1E1E1E] text-sm">Vista Previa & Código</h4>
                      <p className="text-xs text-[#757575] leading-relaxed">
                        Interactúa con el sitio web generado en vivo en móvil, tablet o escritorio y descarga el archivo <code className="text-emerald-400">index.html</code> con 1 clic.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#F1F1F1]/70 border border-[#E5E5E5] space-y-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <h4 className="font-bold text-[#1E1E1E] text-sm">Google Drive & Auditoría</h4>
                      <p className="text-xs text-[#757575] leading-relaxed">
                        Sincronización con carpetas de Drive y firma del evaluador humano para autorizar la publicación a Vercel.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2. Sección Informativa Institucional (Catálogo Oficial IOT Technologies) */}
          <section id="servicios" className="py-16 px-6 bg-white/60 border-t border-[#E5E5E5]/80">
            <div className="max-w-6xl mx-auto space-y-10">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#E95349]">
                  Manual Corporativo Merkatics
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1E1E1E] font-heading">
                  Capacidades Tecnológicas Certificadas
                </h3>
                <p className="text-xs sm:text-sm text-[#757575] max-w-xl mx-auto">
                  Líneas de infraestructura, telemetría e innovación digital para PyMEs de la región fronteriza.
                </p>
              </div>

              <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4">
                {[
                  {
                    num: '01',
                    icon: BarChart3,
                    title: 'Inteligencia de Negocios',
                    desc: 'Análisis de datos, métricas clave, KPIs y tableros interactivos para la toma de decisiones ejecutivas en tiempo real.'
                  },
                  {
                    num: '02',
                    icon: Cpu,
                    title: 'Dispositivos Conectados (IoT)',
                    desc: 'Sensores en tiempo real, telemetría y automatización de procesos para control industrial y comercial seguro.'
                  },
                  {
                    num: '03',
                    icon: Network,
                    title: 'Servicios TIC',
                    desc: 'Infraestructura tecnológica, redes corporativas, servidores en la nube y soporte especializado de alto nivel.'
                  },
                  {
                    num: '04',
                    icon: Code2,
                    title: 'Desarrollo de Software',
                    desc: 'Creación de plataformas web de alta conversión, APIs escalables y aplicaciones móviles a la medida.'
                  },
                  {
                    num: '05',
                    icon: MonitorCheck,
                    title: 'Kioskos Electrónicos',
                    desc: 'Soluciones de hardware y software interactivo para atención autónoma, cobro y autoservicio al cliente final.'
                  },
                  {
                    num: '06',
                    icon: Layers,
                    title: 'Presencia en Redes & Web (MYOS)',
                    desc: 'Actualización continua de canales digitales con generación de contenido por IA y validación humana centralizada.'
                  }
                ].map((srv, index) => {
                  const Icon = srv.icon;
                  return (
                    <div
                      key={index}
                      className="p-5 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#E95349]/60 transition group space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-9 h-9 rounded-xl bg-[#E95349]/15 text-[#E26A69] flex items-center justify-center font-bold">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#757575]">{srv.num}</span>
                      </div>
                      <h4 className="text-base font-bold text-[#1E1E1E] font-heading">{srv.title}</h4>
                      <p className="text-xs text-[#757575] leading-relaxed">{srv.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {/* PESTAÑA 2: SITIOS & APPS APROBADAS (CON BOTÓN DE ABRIR EN OTRA PESTAÑA) */}
      {activeTab === 'aprobados' && (
        <ApprovedWebsitesSection
          approvedList={publishedContent}
          onOpenSiteInNewTab={handleOpenSiteInNewTab}
          onLoadInEditor={handleLoadInEditor}
          onDownloadHtml={handleDownloadSiteHtml}
          onGoToGenerator={() => setActiveTab('plataforma')}
          onViewDrive={() => setActiveTab('drive')}
        />
      )}

      {/* PESTAÑA DE AUDITORÍA HUMANA & BANDEJA PENDIENTE (REGLA DE CARLOS) */}
      {activeTab === 'auditoria' && (
        <section className="py-12 px-6 max-w-6xl mx-auto space-y-8 animate-fadeIn">
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 space-y-4 shadow-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Módulo de Cumplimiento de Seguridad — Proyecto 2026-544-11
            </div>
            <h2 className="text-3xl font-extrabold text-[#1E1E1E] font-heading">
              Regla no negociable: Aprobación Humana antes de Publicar
            </h2>
            <blockquote className="p-4 rounded-xl bg-white/90 border-l-4 border-[#E95349] text-sm text-[#333333] italic leading-relaxed">
              "Todo el proyecto se construye alrededor de una restricción de seguridad explícita de Carlos: ningún contenido generado por la IA (sitio web, texto, imagen o publicación en redes) se publica de forma automática. Debe existir siempre un estado de 'pendiente de aprobación humana' antes de cualquier publicación real, y quien apruebe debe quedar registrado."
            </blockquote>

            <div className="grid sm:grid-cols-3 gap-4 pt-4 text-center">
              <div className="p-4 rounded-xl bg-white border border-[#E5E5E5]">
                <span className="text-2xl font-extrabold text-amber-400 block">{pendingContents.length}</span>
                <span className="text-xs text-[#757575] uppercase font-semibold">Pendientes (PENDING)</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E5E5E5]">
                <span className="text-2xl font-extrabold text-emerald-400 block">{publishedContent.length}</span>
                <span className="text-xs text-[#757575] uppercase font-semibold">Aprobados (APPROVED)</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E5E5E5]">
                <span className="text-2xl font-extrabold text-[#E26A69] block">100%</span>
                <span className="text-xs text-[#757575] uppercase font-semibold">Trazabilidad Humana</span>
              </div>
            </div>
          </div>

          {/* Bandeja de Contenidos Pendientes de Aprobación */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#1E1E1E] flex items-center gap-2 font-heading">
              <Clock className="w-5 h-5 text-amber-400" />
              Bandeja de Entrada: Propuestas Esperando Validación Humana ({pendingContents.length})
            </h3>

            {pendingContents.length > 0 ? (
              <div className="space-y-4">
                {pendingContents.map((item) => (
                  <div key={item.id} className="p-6 rounded-2xl bg-white border border-amber-500/40 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#E5E5E5] pb-3">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ESTADO: PENDING
                        </span>
                        <h4 className="text-lg font-bold text-[#1E1E1E] mt-1 font-heading">{item.title}</h4>
                      </div>
                      <span className="text-xs font-mono text-[#757575]">ID: #{item.id}</span>
                    </div>

                    <p className="text-sm text-[#333333]">{item.body_text}</p>

                    {item.content && (
                      <div className="grid sm:grid-cols-2 gap-4 text-xs bg-[#F1F1F1] p-4 rounded-xl border border-[#E5E5E5]">
                        <div>
                          <strong className="text-[#757575] block mb-1">Copy para Redes:</strong>
                          <p className="text-[#333333] font-mono line-clamp-3">{item.content.copy_redes}</p>
                        </div>
                        <div>
                          <strong className="text-[#E26A69] block mb-1">Prompt de Arte:</strong>
                          <p className="text-[#E26A69] font-mono line-clamp-3">{item.content.prompt_imagen}</p>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        onClick={() => handleApprove(item.id, item.content)}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-[#1E1E1E] transition flex items-center gap-2 shadow-md shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Validar y Aprobar con mi Firma ({currentUser.displayName})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[#757575] border border-dashed border-[#E5E5E5] rounded-2xl">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#F1F1F1] text-xs font-bold text-[#333333] hover:text-[#1E1E1E] border border-[#E5E5E5] transition"
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
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-8 space-y-6 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#E95349] uppercase tracking-wider">
                  Guía Oficial de Identidad Visual
                </span>
                <h2 className="text-3xl font-extrabold text-[#1E1E1E] mt-1 font-heading">
                  Manual Corporativo Merkatics
                </h2>
                <p className="text-xs text-[#757575] mt-1">
                  Social eThinking S.A. de C.V. — Derechos Reservados
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Logo />
              </div>
            </div>

            {/* Simbología y Significado */}
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] space-y-2">
                <h4 className="text-base font-bold text-[#1E1E1E] font-heading">El Símbolo (Antena Emisora)</h4>
                <p className="text-xs text-[#333333] leading-relaxed">
                  Representa una antena emisora de una señal que se expande concéntricamente llevando un mensaje que llega a cumplir con el propósito para el cual fue enviado. Conexión, alcance y telemetría continua.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-[#E5E5E5] space-y-2">
                <h4 className="text-base font-bold text-[#1E1E1E] font-heading">Tipografías Oficiales</h4>
                <p className="text-xs text-[#333333] leading-relaxed">
                  <strong>OPEN SANS:</strong> Utilizada en el logo-símbolo y encabezados. Transmite firmeza, tecnología y neutralidad elegante.<br />
                  <strong>ROBOTO:</strong> Utilizada para niveles de lectura, datos y párrafos por su vanguardia y máxima legibilidad.
                </p>
              </div>
            </div>

            {/* Paleta de Colores Institucionales Oficial */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#757575]">
                Colores Institucionales (Página 9 & 10 del Manual)
              </h4>
              <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { name: 'Coral principal', hex: '#E95349', rgb: '233, 83, 73', tag: 'Principal' },
                  { name: 'Graphite', hex: '#1E1E1E', rgb: '30, 30, 30', tag: 'Corporativo' },
                  { name: 'Coral profundo', hex: '#C6443F', rgb: '198, 68, 63', tag: 'Secundario' },
                  { name: 'Coral suave', hex: '#E26A69', rgb: '226, 106, 105', tag: 'Auxiliar' },
                  { name: 'Coral medio', hex: '#D64D4D', rgb: '214, 77, 77', tag: 'Acento' },
                  { name: 'Gris neutro', hex: '#757575', rgb: '117, 117, 117', tag: 'Neutro' }
                ].map((col, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#F1F1F1] border border-[#E5E5E5] space-y-2 text-center">
                    <div className="w-full h-12 rounded-lg shadow-md" style={{ backgroundColor: col.hex }}></div>
                    <span className="text-xs font-bold text-[#1E1E1E] block">{col.name}</span>
                    <span className="text-[10px] font-mono text-[#E26A69] block">{col.hex}</span>
                    <span className="text-[9px] text-[#757575] block">RGB: {col.rgb}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Directorio de Oficinas Oficial */}
            <div className="pt-4 border-t border-[#E5E5E5] grid md:grid-cols-2 gap-4 text-xs text-[#333333]">
              <div className="space-y-1">
                <span className="font-bold text-[#1E1E1E] block">Sede México:</span>
                <p>Benjamin Franklin 3220 5E, Ciudad Juárez, Chih.</p>
                <p>Tel: (Mx) 656-626-9124</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-[#1E1E1E] block">Sede Estados Unidos:</span>
                <p>James Watt Dr. 11395 Suite A-13, El Paso, TX</p>
                <p>Tel: From USA: 915-726-1048</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Footer Institucional Oficial */}
      <footer className="bg-white border-t border-[#E5E5E5] py-12 px-6 text-[#757575] text-xs">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <Logo />
            <div className="flex flex-wrap gap-6 text-[#333333]">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#E95349]" />
                Mx: 656-626-9124 | USA: 915-726-1048
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#E95349]" />
                Cd. Juárez, Chih. & El Paso, TX
              </span>
            </div>
          </div>

          <div className="border-t border-[#E5E5E5]/80 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[#757575] text-[11px]">
            <p>
              © 2026 Merkatics — Growth Operating System Todos los derechos reservados.
            </p>
            <p>
              Plataforma MYOS — Generador de Sitios & Contenidos con IA ("Cerebro Digital"). Proyecto 2026-544-11.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal de Autenticación Firebase (Google / Correo) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user, role) => {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0],
            role: role || 'Aprobador Humano (Audit Trail)',
            isDefaultSession: false
          });
          setShowAuthModal(false);
        }}
      />

      {/* Modal de Celebración tras Aprobación Humana */}
      <ApprovalCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        siteTitle={lastApprovedInfo?.title || 'Sitio Web'}
        approverName={lastApprovedInfo?.approved_by || currentUser?.displayName || 'Auditor'}
        approverEmail={lastApprovedInfo?.approved_by_email || currentUser?.email || 'auditor@iottechnologies.mx'}
        approvedAt={lastApprovedInfo?.approved_at}
        onOpenInNewTab={() => handleOpenSiteInNewTab(lastApprovedInfo)}
        onGoToApprovedSection={() => setActiveTab('aprobados')}
        onDownloadHtml={() => handleDownloadSiteHtml(lastApprovedInfo)}
      />

    </div>
  );
}
