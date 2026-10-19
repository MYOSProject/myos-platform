// Plantillas de respaldo. SOLO se usan cuando Gemini no responde y la persona lo permite
// de forma explícita (allowFallback). El resultado se marca siempre como source = 'fallback'.
import type { GeneratedWebsite } from './types.js';

export function generateSmartContent(brief: string, options: any = {}): GeneratedWebsite {
  const cleanBrief = brief.trim();
  const lower = cleanBrief.toLowerCase();
  const previousSite = options.previousSite || null;

  // Si el usuario está pidiendo cambios o ajustes sobre una web previamente generada
  if (previousSite && (previousSite.site_name || previousSite.titulo)) {
    const updated = JSON.parse(JSON.stringify(previousSite));

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
      updated.brand_colors = { primary: '#1d7eae', secondary: '#0032a0', accent: '#98dae9' };
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
      updated.hero.primary_cta = 'Aprovechar Promoción';
    }

    if (lower.includes('domicilio') || lower.includes('envio') || lower.includes('envío') || lower.includes('entrega')) {
      updated.hero.trust_badges = Array.from(new Set([...(updated.hero.trust_badges || []), 'Envíos Rápidos a Domicilio', 'Entrega Segura']));
    }

    return updated;
  }

  // 1. Veterinarias, Animales, Perros, Gatos, Estética Canina y Spa de Mascotas
  if (
    lower.includes('veterinaria') ||
    lower.includes('mascota') ||
    lower.includes('perro') ||
    lower.includes('gato') ||
    lower.includes('canin') ||
    lower.includes('felin') ||
    lower.includes('animal')
  ) {
    const isUrgencias = lower.includes('24') || lower.includes('urgencia') || lower.includes('hospital');
    const siteName = isUrgencias ? 'VetCare 24/7 - Hospital Veterinario & Especialidades' : 'PetLife - Clínica Veterinaria & Spa Canino';
    return {
      titulo: `${siteName}: Cuidado Experto, Amor y Medicina Preventiva para tu Mascota`,
      site_name: siteName,
      industry: 'Medicina Veterinaria, Hospitalización & Spa de Mascotas',
      tagline: 'La salud, bienestar y felicidad de tu mejor amigo en manos de médicos veterinarios apasionados y certificados.',
      brand_colors: {
        primary: '#059669',
        secondary: '#047857',
        accent: '#d1fae5'
      },
      hero: {
        badge: isUrgencias ? '🚨 Urgencias 24 Horas & Hospitalización' : '🐾 Cuidado y Amor Incondicional para tu Mascota',
        title: 'Atención Médica Veterinaria de Calidad con Tecnología Avanzada',
        subtitle: 'Consulta general y de especialidad, cirugías seguras, laboratorio clínico propio, estética canina profesional y farmacia veterinaria completa.',
        primary_cta: 'Agendar Cita o Consulta',
        secondary_cta: 'Servicio de Urgencias 24/7',
        trust_badges: ['Médicos Certificados', 'Laboratorio & Rayos X en Sitio', 'Monitoreo 24 Horas']
      },
      services: [
        {
          title: 'Consulta Médica & Vacunación',
          description: 'Medicina preventiva, desparasitación, esquemas completos de cachorros y chequeos geriátricos.',
          icon: 'ShieldCheck',
          badge: 'Preventivo'
        },
        {
          title: 'Cirugía de Tejidos Blandos & Quirófano',
          description: 'Esterilizaciones seguras, monitoreo anestésico multiparamétrico y recuperación supervisada.',
          icon: 'Sparkles',
          badge: 'Quirófano Pro'
        },
        {
          title: 'Estética Canina & Spa Relajante',
          description: 'Baños medicados, corte de raza, limpieza dental no invasiva y corte de uñas con amor.',
          icon: 'Heart',
          badge: 'Consentidos'
        }
      ],
      about: {
        title: 'Pasión por la Vida Animal y Calidez Humana',
        content: `En ${siteName} entendemos que tu mascota es un miembro indispensable de tu familia. Por eso, diseñamos un espacio libre de estrés donde cada perro y gato recibe trato amoroso, paciencia y diagnósticos basados en evidencia médica.\n\nContamos con quirófano moderno y área de hospitalización aislada para perros y gatos.`,
        metrics: [
          { label: 'Mascotas Sanadas', value: '+12,400' },
          { label: 'Cirugías Exitosas', value: '99.9%' },
          { label: 'Años Cuidando Mascotas', value: '10 Años' }
        ]
      },
      blog_posts: [
        {
          title: 'Signos de Alarma: Cuándo Llevar a tu Perro o Gato al Veterinario de Emergencia',
          excerpt: 'Aprende a reconocer síntomas críticos como vómito persistente, letargo súbito o dificultad respiratoria.',
          read_time: '4 min',
          date: 'Esta semana'
        },
        {
          title: 'Guía de Vacunación y Desparasitación Anual para Mascotas Felices',
          excerpt: 'Por qué los refuerzos anuales protegen a toda tu familia contra enfermedades zoonóticas.',
          read_time: '3 min',
          date: 'Hace unos días'
        }
      ],
      contact: {
        title: 'Trae a tu Mascota o Contáctanos por WhatsApp',
        subtitle: 'Atención personalizada, citas programadas y urgencias médicas.',
        phone: '+52 (656) 880-9911',
        email: 'citas@vetcare24.mx',
        address: 'Av. Paseo de la Victoria #4400, Zona Campestre'
      },
      social_posts: {
        facebook: {
          copy: '🐶 ¡En VetCare consentimos a tu mejor amigo como se merece! Ya sea para su vacuna, chequeo general o día de spa en estética canina, nuestro equipo médico está listo para recibirlo con los brazos abiertos.\n\n📍 Agenda tu cita por WhatsApp.',
          cta: 'Agendar Consulta'
        },
        instagram: {
          copy: 'La mirada de agradecimiento de una mascota sana no tiene precio. ✨🐾 Cuidamos su corazón, su piel y su alegría todos los días.',
          hashtags: '#Veterinaria #AmorPerruno #CuidadoMascotas #Gatitos #VetCare #SaludAnimal'
        }
      },
      resumen_web: `En ${siteName} brindamos atención integral a mascotas con servicios médicos preventivos, quirúrgicos y de estética canina con los más altos estándares hospitalarios y calidez humana.`,
      copy_redes: '🐾 Cuidado veterinario especializado con tecnología y amor para tu mascota. ¡Agenda hoy mismo!',
      prompt_imagen: 'Fotografía publicitaria profesional de veterinario joven y empático examinando a un perro labrador dorado feliz y sano en clínica veterinaria moderna e iluminada, tonos verdes esmeralda y blanco limpio, calidad 8k.'
    };
  }

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

  // 3. IoT, Industria 4.0 o Sensores (Solo si se menciona explícitamente)
  if (lower.includes('iot') || lower.includes('sensor') || lower.includes('telemetria') || lower.includes('maquiladora') || lower.includes('industrial')) {
    const siteName = 'Pulse IoT Solutions';
    const area = 'Dispositivos Conectados e Internet de las Cosas (IoT)';
    return {
      titulo: 'Plataforma de Telemetría y Sensores Conectados para la Industria',
      site_name: siteName,
      industry: area,
      tagline: 'Monitoreo inteligente en tiempo real y automatización para la industria moderna.',
      brand_colors: { primary: '#1d7eae', secondary: '#0032a0', accent: '#98dae9' },
      hero: {
        badge: '🌐 Redes de Sensores en Tiempo Real',
        title: 'Optimice sus Operaciones Industriales con Telemetría IoT',
        subtitle: 'Plataforma de alta confiabilidad diseñada para capturar variables críticas de sensores, predecir paros no programados y reducir costos operativos con soporte 24/7.',
        primary_cta: 'Solicitar Demostración Técnica',
        secondary_cta: 'Ver Arquitectura de Red',
        trust_badges: ['Disponibilidad 99.9%', 'Protocolos Criptográficos', 'Ingeniería en Sitio']
      },
      services: [
        { title: 'Monitoreo de Variables Críticas', description: 'Temperatura, vibración, presión y consumo eléctrico transmitidos por redes seguras.', icon: 'Cpu', badge: 'Tiempo Real' },
        { title: 'Tableros de Business Intelligence', description: 'Consola web ejecutiva que convierte millones de lecturas en indicadores accionables.', icon: 'BarChart3', badge: 'Alta Dirección' },
        { title: 'Alertas Tempranas y Automatización', description: 'Notificaciones automáticas a supervisores antes de que ocurra una falla crítica.', icon: 'Network', badge: 'Mantenimiento Predictivo' }
      ],
      about: {
        title: 'Ingeniería Fronteriza Orientada a Cero Paros',
        content: 'Diseñamos e implementamos infraestructura de hardware y software para maquiladoras y PyMEs industriales.\n\nNuestras soluciones resisten entornos severos y se conectan sin fricción con los sistemas ERP ya instalados en su planta.',
        metrics: [
          { label: 'Sensores en Producción', value: '+12,000' },
          { label: 'Reducción de Paros', value: '34%' },
          { label: 'Tiempo de Despliegue', value: '< 7 Días' }
        ]
      },
      blog_posts: [
        { title: 'Cómo la Telemetría IoT Salvó una Cadena de Frío Farmacéutica', excerpt: 'Caso de estudio sobre la implementación de sensores certificados en almacenes logísticos de la frontera.', read_time: '5 min', date: 'Esta semana' },
        { title: 'Protocolos de Comunicación Seguros para Sensores en Fábricas Inteligentes', excerpt: 'Comparativa entre LoRaWAN, MQTT y redes celulares privadas para telemetría industrial.', read_time: '4 min', date: 'Hace unos días' }
      ],
      contact: {
        title: 'Inicie un Piloto en su Planta',
        subtitle: 'Nuestros ingenieros evalúan sus líneas de producción sin costo.',
        phone: '+52 (656) 613-0000',
        email: 'contacto@iottechnologies.mx',
        address: 'Parque Industrial Juárez, Edificio Tecnológico 4'
      },
      social_posts: {
        facebook: { copy: '🌐 Monitoree activos críticos en tiempo real desde cualquier dispositivo con sensores IoT de alta precisión de IOT Technologies.', cta: 'Contactar a un Ingeniero' },
        instagram: { copy: '¿Sabes cuánto cuesta una hora de paro imprevisto en tu línea de producción? 💡 La telemetría en tiempo real te permite actuar antes de que la maquinaria falle.', hashtags: '#IoT #Industria40 #MonitoreoRemoto #IOTTechnologies #TransformacionDigital' }
      },
      resumen_web: 'Monitoreo de activos y telemetría de alta confiabilidad para industrias y empresas en crecimiento.',
      copy_redes: '🚀 ¡Impulsa el rendimiento de tu negocio con soluciones tecnológicas de vanguardia!',
      prompt_imagen: 'Fotografía publicitaria corporativa de tecnología industrial, sensores conectados emitiendo datos visuales en tonos azul brillante (#1d7eae) y fondo tecnológico (#231f20), realismo 8k.',
      drive_files: {
        pages_file: '/Sitio_Web/Paginas/pulse_iot_landing.json',
        blog_file: '/Sitio_Web/Blog/articulo_iot.md',
        social_file: '/Redes_Sociales/Para_Publicar/campaña_iot.json'
      }
    };
  }

  // 4. Moda, Ropa, Calzado & Tiendas E-Commerce
  if (lower.includes('ropa') || lower.includes('moda') || lower.includes('calzado') || lower.includes('zapato') || lower.includes('tenis') || lower.includes('sneaker') || lower.includes('tienda') || lower.includes('boutique')) {
    const siteName = 'Nova Concept Store - Moda & Tendencias';
    return {
      titulo: `${siteName}: Catálogo Exclusivo, Calzado y Prendas de Alta Calidad`,
      site_name: siteName,
      industry: 'Moda, Indumentaria Urbana & Comercio Electrónico',
      tagline: 'Prendas exclusivas, calzado premium y accesorios diseñados para resaltar tu estilo único.',
      brand_colors: { primary: '#be185d', secondary: '#9d174d', accent: '#fce7f3' },
      hero: {
        badge: '✨ Nueva Colección Temporada 2026',
        title: 'Estilo, Calidad y Tendencias Diseñadas para tu Personalidad',
        subtitle: 'Descubre nuestra selección curada de prendas modernas, calzado exclusivo y accesorios con envíos rápidos y garantía de satisfacción.',
        primary_cta: 'Explorar Catálogo',
        secondary_cta: 'Ver Promociones',
        trust_badges: ['Envíos Rápidos a Todo el País', 'Cambios Sin Complicaciones', 'Prendas 100% Originales']
      },
      services: [
        { title: 'Colecciones de Tendencia & Streetwear', description: 'Prendas con cortes modernos, telas de alta durabilidad y diseños que marcan la pauta.', icon: 'Sparkles', badge: 'Nuevo' },
        { title: 'Calzado & Sneakers Exclusivos', description: 'Tenis y calzado casual de marcas destacadas con máxima comodidad y ergonomía.', icon: 'TrendingUp', badge: 'Más Vendido' },
        { title: 'Asesoría de Imagen y Outfits', description: 'Combinaciones recomendadas por estilistas para eventos, trabajo o uso diario.', icon: 'Heart', badge: 'Personalizado' }
      ],
      about: {
        title: 'Moda Auténtica Pensada para Ti',
        content: 'Nacimos con la pasión por ofrecer prendas que combinen diseño contemporáneo con comodidad duradera. Cada artículo de nuestro catálogo pasa por un estricto control de calidad para que vistas con confianza.',
        metrics: [
          { label: 'Clientes Satisfechos', value: '+18,500' },
          { label: 'Colecciones Lanzadas', value: '24' },
          { label: 'Calificación de Calidad', value: '4.9 ★' }
        ]
      },
      blog_posts: [
        { title: 'Cómo Combinar Calzado Casual con Prendas Elegantes sin Esfuerzo', excerpt: 'Guía práctica para armar looks versátiles de día y de noche con solo 3 piezas clave.', read_time: '3 min', date: 'Esta semana' },
        { title: 'Los Colores y Texturas que Dominarán las Calles esta Temporada', excerpt: 'Un vistazo a las tendencias globales de moda urbana y cómo adaptarlas a tu clóset.', read_time: '4 min', date: 'Hace unos días' }
      ],
      contact: {
        title: 'Visítanos o Haz tu Pedido en Línea',
        subtitle: 'Atención personalizada y asesoría por WhatsApp en todo momento.',
        phone: '+52 (656) 332-9900',
        email: 'ventas@novaconcept.mx',
        address: 'Plaza Galerías, Local 42, Zona Comercial'
      },
      social_posts: {
        facebook: { copy: '👗 ¡Estrena tus prendas favoritas hoy! Envíos rápidos y descuentos en tu primera compra.', cta: 'Ver Catálogo y Precios' },
        instagram: { copy: 'El outfit ideal para destacar en cualquier lugar. ✨👟 Cuéntanos cuál es tu estilo favorito.', hashtags: '#ModaUrbana #Sneakers #EstiloUnico #Tendencias2026 #OOTD' }
      },
      resumen_web: 'Catálogo de moda y calzado contemporáneo con envíos a todo México y atención personalizada.',
      copy_redes: '✨ Luce increíble con lo más nuevo en moda y calzado. ¡Compra en línea con entrega inmediata!',
      prompt_imagen: 'Fotografía publicitaria de moda editorial de alta costura urbana, modelos jóvenes en ropa vanguardista en estudio limpio con iluminación suave, 8k.'
    };
  }

  // 5. Florerías, Flores, Tulipanes, Rosas y Detalles
  if (lower.includes('flor') || lower.includes('tulipan') || lower.includes('rosa') || lower.includes('ramo') || lower.includes('arreglo floral')) {
    const sName = 'Bella Rosa Florería & Diseños Florales';
    return {
      titulo: `${sName}: Arreglos Florales Exclusivos y Entrega Inmediata`,
      site_name: sName,
      industry: 'Florería Boutique & Arreglos de Alta Gama',
      tagline: 'Flores frescas de corte diario que transmiten emociones y momentos inolvidables.',
      brand_colors: { primary: '#db2777', secondary: '#9d174d', accent: '#fce7f3' },
      hero: {
        badge: '🌸 Flores 100% Frescas • Entrega el Mismo Día',
        title: 'Arreglos Florales Únicos que Hablan por Ti',
        subtitle: `Ramos de rosas rojas, tulipanes holandeses, orquídeas y diseños florales para aniversarios, cumpleaños y ocasiones especiales con entrega rápida.`,
        primary_cta: 'Ver Catálogo de Ramos',
        secondary_cta: 'Pedir por WhatsApp',
        trust_badges: ['Flores Frescas Garantizadas', 'Entrega en 90 Minutos', 'Tarjeta Personalizada Gratis']
      },
      services: [
        { title: 'Ramos de Rosas & Tulipanes Premium', description: 'Selección de flores importadas con envoltura de lujo y listón satinado.', icon: 'Sparkles', badge: 'Más Vendido' },
        { title: 'Arreglos para Ocasiones Especiales', description: 'Diseños florales para aniversarios, bodas, graduaciones y eventos corporativos.', icon: 'Heart', badge: 'Exclusivo' },
        { title: 'Servicio a Domicilio Express', description: 'Entregamos tu sorpresa floral puntualmente con mensaje personalizado.', icon: 'TrendingUp', badge: 'Mismo Día' }
      ],
      about: {
        title: 'Pasión por el Arte Floral',
        content: `En ${sName} seleccionamos cada flor una por una desde los invernaderos más prestigiosos. Creemos que cada ramo cuenta una historia de amor, gratitud o celebración, y cuidamos cada detalle para que tu regalo sea perfecto.`,
        metrics: [{ label: 'Arreglos Entregados', value: '+8,500' }, { label: 'Sonrisas Generadas', value: '100%' }, { label: 'Años de Trayectoria', value: '7+' }]
      },
      blog_posts: [
        { title: 'Cómo Cuidar tus Rosas y Tulipanes para que Duren más de 12 Días', excerpt: 'Consejos prácticos para cortar tallos, cambiar agua y mantener tus flores resplandecientes.', read_time: '3 min', date: 'Esta semana' },
        { title: 'El Significado de los Colores en las Rosas', excerpt: 'Descubre qué mensaje transmite cada color antes de elegir tu ramo ideal.', read_time: '4 min', date: 'Hace unos días' }
      ],
      contact: {
        title: 'Haz tu Pedido o Personaliza tu Ramo',
        subtitle: 'Atención rápida por WhatsApp y entregas a domicilio.',
        phone: '+52 (656) 555-0199',
        email: 'pedidos@floreriarosa.com',
        address: 'Cobertura en toda la ciudad'
      },
      social_posts: {
        facebook: { copy: '🌹 ¡Sorprende a esa persona especial hoy mismo! Ramos de rosas y tulipanes frescos con entrega a domicilio.', cta: 'Ver Modelos y Precios' },
        instagram: { copy: 'El amor florece con los detalles correctos. ✨🌷 Haz tu pedido hoy con entrega express.', hashtags: '#Flores #Floreria #Rosas #Tulipanes #DetallesConAmor' }
      },
      resumen_web: 'Catálogo floral premium con venta de ramos de rosas, tulipanes y entrega express a domicilio.',
      copy_redes: '💐 Sorprende con el ramo perfecto. ¡Haz tu pedido hoy con entrega inmediata!',
      prompt_imagen: 'Fotografía comercial editorial de bouquet de rosas rojas y tulipanes rosados frescos en papel kraft elegante, iluminación suave y fondo limpio, 8k.'
    };
  }

  // 6. Donas, Panadería, Pastelería y Repostería
  if (lower.includes('dona') || lower.includes('pastel') || lower.includes('reposteria') || lower.includes('cupcake')) {
    const sName = 'Dulce Tentación - Donas & Pastelería';
    return {
      titulo: `${sName}: Donas Artesanales, Pasteles y Repostería Fina`,
      site_name: sName,
      industry: 'Repostería Artesanal, Donas Gourmet & Café',
      tagline: 'Masa fresca horneada a diario, rellenos irresistibles y café de altura.',
      brand_colors: { primary: '#ea580c', secondary: '#9a3412', accent: '#fed7aa' },
      hero: {
        badge: '🍩 Horneadas Frescas Cada Mañana',
        title: 'El Sabor Irresistible de las Donas Gourmet Hechas con Amor',
        subtitle: 'Donas artesanales glaseadas, rellenas de nutella, dulce de leche y frutos rojos, acompañadas del mejor café.',
        primary_cta: 'Ver Menú de Donas & Postres',
        secondary_cta: 'Hacer Pedido a Domicilio',
        trust_badges: ['100% Ingredientes Naturales', 'Horneadas al Momento', 'Cajas de Regalo Personalizadas']
      },
      services: [
        { title: 'Donas Clásicas y Glaseadas', description: 'Masa suave y esponjosa con glaseado tradicional de vainilla, chocolate y canela.', icon: 'Sparkles', badge: 'Favoritas' },
        { title: 'Especialidades Rellenas Gourmet', description: 'Rellenos generosos de crema pastelera, nutella, cajeta y compota de fresa natural.', icon: 'Heart', badge: 'Más Pedidas' },
        { title: 'Combos para Eventos & Fiestas', description: 'Cajas de 6, 12 o 24 donas decoradas para reuniones, cumpleaños y empresas.', icon: 'Users', badge: 'Paquetes' }
      ],
      about: {
        title: 'Nuestra Receta Secreta',
        content: `En ${sName} creemos que cada mordida debe ser un momento de pura felicidad. Usamos harina de trigo selecta, mantequilla pura y fermentación lenta para lograr la textura más suave del mercado.`,
        metrics: [{ label: 'Donas Horneadas al Mes', value: '+20,000' }, { label: 'Clientes Enamorados', value: '99.8%' }, { label: 'Recetas Originales', value: '18+' }]
      },
      blog_posts: [
        { title: 'El Secreto de una Masa Esponjosa: Fermentación y Temperatura', excerpt: 'Cómo logramos la consistencia perfecta sin conservadores artificiales.', read_time: '3 min', date: 'Esta semana' },
        { title: 'Los 5 Mejores Maridajes: Café Americano y Donas de Chocolate', excerpt: 'Por qué la combinación clásica de café tostado y chocolate sigue siendo insuperable.', read_time: '3 min', date: 'Hace unos días' }
      ],
      contact: {
        title: 'Haz tu Pedido o Visítanos en Sucursal',
        subtitle: 'Servicio a domicilio rápido para que disfrutes calientitas.',
        phone: '+52 (656) 555-0199',
        email: 'antojos@dulcetentacion.com',
        address: 'Servicio en mostrador y a domicilio'
      },
      social_posts: {
        facebook: { copy: '🍩 ¡Tu día merece un premio dulce! Pide hoy tu caja de donas artesanales recién salidas del horno.', cta: 'Pedir por WhatsApp' },
        instagram: { copy: 'Esponjosas, deliciosas y con mucho relleno. ✨ ¿Cuál es tu sabor favorito? Escríbenos para enviártelas.', hashtags: '#Donas #Donuts #Reposteria #Pasteleria #Foodie' }
      },
      resumen_web: 'Catálogo de donas artesanales, pasteles personalizados y postres con servicio a domicilio.',
      copy_redes: '🍩 Donas recién horneadas con el mejor sabor de la ciudad. ¡Pide tu caja hoy!',
      prompt_imagen: 'Fotografía publicitaria de donas artesanales glaseadas con chocolate y chispas sobre charola rústica con taza de café, iluminación cálida de panadería, 8k.'
    };
  }

  // 7. Taquerías, Tacos y Comida Mexicana
  if (lower.includes('taco') || lower.includes('taqueria') || lower.includes('pastor') || lower.includes('carnitas')) {
    const sName = 'Taquería El Auténtico Pastor';
    return {
      titulo: `${sName}: Los Mejores Tacos al Pastor, Asada y Especialidades`,
      site_name: sName,
      industry: 'Taquería Tradicional & Comida Mexicana',
      tagline: 'Sabor de tradición con carne marinada al pastor, tortillas recién hechas y salsas bravas.',
      brand_colors: { primary: '#dc2626', secondary: '#991b1b', accent: '#fef08a' },
      hero: {
        badge: '🌮 Tradición Taquera & Trompo al Pastor',
        title: 'El Auténtico Sabor del Pastor y la Asada Directo a tu Mesa',
        subtitle: 'Tacos al pastor con piña, bistec, costilla, gringas, volcanes y las mejores salsas. Servicio a domicilio rápido y en sucursal.',
        primary_cta: 'Ver Menú Taquero',
        secondary_cta: 'Pedir a Domicilio por WhatsApp',
        trust_badges: ['Carne 100% Calidad Sonora', 'Tortillas Hechas a Mano', 'Salsas Tradicionales Bravas']
      },
      services: [
        { title: 'Tacos al Pastor Tradicional', description: 'Carne de cerdo marinada con receta de la casa, asada al carbón con piña asada.', icon: 'Sparkles', badge: 'Estrella' },
        { title: 'Gringas, Volcanes y Costras', description: 'Queso fundido dorado con tu carne favorita en tortilla de harina o maíz.', icon: 'Heart', badge: 'Favorito' },
        { title: 'Tacos de Asada y Arrachera', description: 'Cortes jugosos asados a la parrilla con cebollitas cambray y chiles toreados.', icon: 'TrendingUp', badge: 'Cortes Pro' }
      ],
      about: {
        title: 'Más de 15 Años de Tradición',
        content: `En ${sName} respetamos la auténtica receta mexicana: marinado de 24 horas, cocción lenta al trompo y tortillas hechas al momento. Ven y comprueba por qué somos la taquería consentida de las familias mexicanas.`,
        metrics: [{ label: 'Tacos Servidos al Día', value: '+3,500' }, { label: 'Años de Sazón', value: '15 Años' }, { label: 'Clientes Frecuentes', value: '100%' }]
      },
      blog_posts: [
        { title: 'La Historia del Taco al Pastor y su Adaptación al Paladar Mexicano', excerpt: 'De la cocina de Medio Oriente a las calles de México: el origen de nuestro taco insignia.', read_time: '3 min', date: 'Esta semana' },
        { title: 'El Secreto de una Buena Salsa Taquera: Tiempos y Chiles', excerpt: 'Cómo balancear el picor del habanero y chile de árbol con tomate y especias.', read_time: '4 min', date: 'Hace unos días' }
      ],
      contact: {
        title: 'Pide tus Tacos o Visítanos en Sucursal',
        subtitle: 'Servicio a domicilio rápido con empaque térmico para que lleguen calientes.',
        phone: '+52 (656) 555-0199',
        email: 'taqueria@elautenticopastor.com',
        address: 'Abierto todos los días de 2:00 PM a 2:00 AM'
      },
      social_posts: {
        facebook: { copy: '🌮 ¿Antojo de unos buenos tacos al pastor con mucha piña y salsita brava? Pide ya a domicilio.', cta: 'Pedir por WhatsApp' },
        instagram: { copy: 'El sonido del trompo girando y el aroma que enamora. 🔥 ¡Te esperamos hoy con las órdenes bien servidas!', hashtags: '#Tacos #TacosAlPastor #Taqueria #ComidaMexicana #TacoTuesday' }
      },
      resumen_web: 'Menú taquero completo con pastor, asada, gringas y pedidos rápidos a domicilio.',
      copy_redes: '🌮 ¡Hoy se cena tacos de verdad! Pide a domicilio o visítanos en sucursal.',
      prompt_imagen: 'Fotografía gastronómica de orden de 5 tacos al pastor con cebolla, cilantro y piña en plato de barro, limón cortado y salsas, 8k.'
    };
  }

  // 8. Generador Dinámico Universal: Sintetiza marca y propuesta profesional sin concatenar instrucciones
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

  let dynPrimary = '#1d7eae';
  let dynSecondary = '#0032a0';
  let dynAccent = '#98dae9';

  if (lower.includes('rosa') || lower.includes('pastel')) {
    dynPrimary = '#db2777'; dynSecondary = '#9d174d'; dynAccent = '#fbcfe8';
  } else if (lower.includes('dorad') || lower.includes('oro')) {
    dynPrimary = '#d97706'; dynSecondary = '#78350f'; dynAccent = '#fde68a';
  } else if (lower.includes('verde') || lower.includes('eco')) {
    dynPrimary = '#059669'; dynSecondary = '#047857'; dynAccent = '#a7f3d0';
  } else if (lower.includes('naranja') || lower.includes('fuego')) {
    dynPrimary = '#ea580c'; dynSecondary = '#9a3412'; dynAccent = '#fed7aa';
  } else if (lower.includes('rojo')) {
    dynPrimary = '#dc2626'; dynSecondary = '#991b1b'; dynAccent = '#fca5a5';
  } else if (lower.includes('morad') || lower.includes('purpura')) {
    dynPrimary = '#7c3aed'; dynSecondary = '#5b21b6'; dynAccent = '#ddd6fe';
  }

  return {
    titulo: `${dynamicBrand}: Soluciones Profesionales de Alta Calidad`,
    site_name: dynamicBrand,
    industry: 'Servicios Profesionales & Soluciones a Medida',
    tagline: 'Calidad superior, atención personalizada y resultados comprobados.',
    brand_colors: { primary: dynPrimary, secondary: dynSecondary, accent: dynAccent },
    hero: {
      badge: '✨ Calidad Garantizada & Atención Inmediata',
      title: 'Soluciones Profesionales Diseñadas para Superar tus Expectativas',
      subtitle: 'Atención personalizada, presupuestos transparentes y la mejor experiencia de servicio diseñada a tu medida.',
      primary_cta: 'Solicitar Cotización / Información',
      secondary_cta: 'Contactar por WhatsApp',
      trust_badges: ['Atención 100% Personalizada', 'Precios Claros y Transparentes', 'Garantía de Satisfacción']
    },
    services: [
      {
        title: 'Asesoría y Atención Personalizada',
        description: 'Te orientamos paso a paso para ofrecerte exactamente la solución que se adapta a tus necesidades.',
        icon: 'Sparkles',
        badge: 'Destacado'
      },
      {
        title: 'Servicios de Calidad Garantizada',
        description: 'Procesos optimizados y atención de primer nivel con los más altos estándares de satisfacción.',
        icon: 'ShieldCheck',
        badge: 'Recomendado'
      },
      {
        title: 'Atención Rápida y Soporte Continuo',
        description: 'Compromiso firme en cada etapa para que tu experiencia sea ágil, confiable y segura.',
        icon: 'TrendingUp',
        badge: 'Garantizado'
      }
    ],
    about: {
      title: 'Compromiso y Pasión por lo que Hacemos',
      content: `En ${dynamicBrand} nos dedicamos a entregar un servicio impecable y transparente. Cada cliente es único y trabajamos con la mayor dedicación para superar tus expectativas en cada detalle.`,
      metrics: [
        { label: 'Clientes Atendidos', value: '+1,500' },
        { label: 'Satisfacción Comprobada', value: '99.5%' },
        { label: 'Años de Experiencia', value: '8 Años' }
      ]
    },
    blog_posts: [
      {
        title: 'Recomendaciones Clave para Elegir la Mejor Opción',
        excerpt: 'Aspectos fundamentales que debes evaluar para garantizar una experiencia satisfactoria y segura.',
        read_time: '3 min',
        date: 'Esta semana'
      },
      {
        title: 'Tendencias y Buenas Prácticas para Mejores Resultados',
        excerpt: 'Cómo la innovación constante nos permite ofrecer un servicio más rápido y eficiente.',
        read_time: '4 min',
        date: 'Hace unos días'
      }
    ],
    contact: {
      title: 'Ponte en Contacto con Nuestro Equipo',
      subtitle: 'Cotizaciones sin compromiso y respuesta rápida por WhatsApp.',
      phone: '+52 (656) 555-0100',
      email: `contacto@${dynamicBrand.toLowerCase().replace(/[^a-z0-9]/g, '') || 'negocio'}.com`,
      address: 'Cobertura Integral'
    },
    social_posts: {
      facebook: {
        copy: `¿Buscando la mejor opción con calidad y atención personalizada? En ${dynamicBrand} estamos listos para atenderte hoy.`,
        cta: 'Contactar por WhatsApp'
      },
      instagram: {
        copy: 'Calidad, compromiso y resultados que marcan la diferencia. ✨ Escríbenos para más información.',
        hashtags: '#Calidad #ServiciosProfesionales #AtencionAlCliente #Resultados #PyME'
      }
    },
    resumen_web: `Sitio web y catálogo integral para ${dynamicBrand}, desarrollado para captar clientes calificados y brindar información clara.`,
    copy_redes: `🚀 ¡Descubre las mejores soluciones con ${dynamicBrand}! Calidad y atención personalizada.`,
    prompt_imagen: `Fotografía publicitaria profesional, estética moderna y limpia, iluminación de estudio, alta resolución 8k.`
  };
}
