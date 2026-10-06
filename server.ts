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
  content?: {
    titulo: string;
    resumen_web: string;
    copy_redes: string;
    prompt_imagen: string;
  };
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
function generateSmartContent(brief: string) {
  const cleanBrief = brief.trim();
  const lower = cleanBrief.toLowerCase();

  let area = 'Innovación Tecnológica';
  if (lower.includes('iot') || lower.includes('sensor') || lower.includes('dispositivo')) {
    area = 'Dispositivos Conectados e Internet de las Cosas (IoT)';
  } else if (lower.includes('datos') || lower.includes('inteligencia') || lower.includes('bi')) {
    area = 'Inteligencia de Negocios y Analítica Avanzada';
  } else if (lower.includes('software') || lower.includes('app') || lower.includes('web')) {
    area = 'Desarrollo de Software y Plataformas Digitales';
  } else if (lower.includes('kiosko') || lower.includes('hardware')) {
    area = 'Kioskos Electrónicos y Terminales Interactivas';
  } else if (lower.includes('tic') || lower.includes('nube') || lower.includes('soporte')) {
    area = 'Servicios TIC e Infraestructura Cloud';
  }

  const titulo = `Soluciones en Innovación: ${cleanBrief.slice(0, 48)}`;
  const resumen_web = `En IOT Technologies potenciamos el crecimiento de su empresa mediante ${area.toLowerCase()} enfocada en resultados comerciales tangibles. Nuestra plataforma centraliza la captura de información, automatización y monitoreo operativo en una sola consola.\n\nDiseñado bajo estándares corporativos y respaldado por nuestro equipo de consultores e ingenieros especializados. Optimice sus costos operativos y tome el control de cada proceso clave hoy mismo.`;
  const copy_redes = `🚀 ¡Impulsa el rendimiento de tu negocio con soluciones tecnológicas de vanguardia!\n\nEn IOT Technologies desarrollamos proyectos a la medida en ${area}: "${cleanBrief}".\n\n✅ Monitoreo y control inteligente en tiempo real\n✅ Alta disponibilidad y soporte técnico certificado\n✅ Plataformas diseñadas para PyMEs y empresas corporativas\n\n📩 Agenda una sesión con nuestros consultores hoy mismo: contacto@iottechnologies.mx\n\n#IOTTechnologies #BusinessInnovation #IoT #TransformacionDigital #SoftwareDevelopment #TechSolutions #BusinessIntelligence`;
  const prompt_imagen = `Fotografía publicitaria corporativa de alta tecnología para IOT Technologies, mostrando ingenieros trabajando con interfaces de business intelligence y dispositivos IoT conectados, iluminación en azul Pantone 640C (#1d7eae) y azul marino (#0032a0), fondo minimalista slate (#231f20), calidad 8K hiperrealista, estilo editorial.`;

  return { titulo, resumen_web, copy_redes, prompt_imagen };
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

  if (apiKey) {
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemPrompt = `Eres el Cerebro Digital de IOT Technologies (empresa de Business Innovation Solutions especializada en Inteligencia de Negocios, Dispositivos Conectados IoT, Servicios TIC, Desarrollo de Software y Kioskos Electrónicos).
A partir de la instrucción o brief del usuario: "${brief.trim()}"
Genera una propuesta integral de contenido formal y atractiva.
Responde ÚNICAMENTE un JSON válido con estas llaves exactas:
- "titulo": Título corporativo atractivo y profesional
- "resumen_web": Texto en 2 párrafos enfocado en conversión para el sitio web
- "copy_redes": Publicación para Instagram/LinkedIn con gancho, viñetas de beneficios, CTA y hashtags
- "prompt_imagen": Descripción detallada en lenguaje fotográfico y artístico para generar la imagen promocional (incorporando colores institucionales azul #1d7eae y grafito #231f20)`;

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
        if (parsedContent?.titulo) break;
      } catch (err: any) {
        console.warn(`Model ${modelName} error:`, err?.message || err);
      }
    }
  }

  // Fallback if API unavailable or quota exceeded
  if (!parsedContent || !parsedContent.titulo) {
    parsedContent = generateSmartContent(brief);
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

startServer();
