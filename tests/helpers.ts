import http from 'http';
import type { AddressInfo } from 'net';

export interface MockRequest {
  url: string;
  headers: http.IncomingHttpHeaders;
  body: any;
}

/** Servidor que imita la API de Gemini (generateContent). */
export async function startMockGemini(
  handler: (req: MockRequest, n: number) => { status: number; body: any } | Promise<{ status: number; body: any }>
) {
  const requests: MockRequest[] = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', async () => {
      let body: any = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        /* ignore */
      }
      const r: MockRequest = { url: req.url || '', headers: req.headers, body };
      requests.push(r);
      const out = await handler(r, requests.length);
      res.writeHead(out.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out.body));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise<void>((resolve) => server.close(() => resolve()))
  };
}

export const geminiOk = (json: unknown) => ({
  status: 200,
  body: { candidates: [{ content: { role: 'model', parts: [{ text: typeof json === 'string' ? json : JSON.stringify(json) }] }, finishReason: 'STOP' }] }
});

export const geminiError = (status: number, message: string, statusText = '') => ({
  status,
  body: { error: { code: status, message, status: statusText } }
});

export const SAMPLE_SITE = {
  titulo: 'Taquería Don Pastor: tacos al trompo en Juárez',
  site_name: 'Taquería Don Pastor',
  industry: 'Restaurante · Tacos',
  tagline: 'Tacos al pastor recién cortados del trompo',
  brand_colors: { primary: '#d62828', secondary: '#1b1b1b', accent: '#f7b267' },
  hero: {
    badge: 'Hecho al momento',
    title: 'El sabor del trompo, en cada taco',
    subtitle: 'Pastor, asada y gringas preparados al momento con tortilla recién hecha.',
    primary_cta: 'Pedir por WhatsApp',
    secondary_cta: 'Ver el menú',
    trust_badges: ['Tortilla hecha al momento', 'Salsas de la casa', 'Servicio a domicilio']
  },
  services: [
    { title: 'Tacos al pastor', description: 'Carne marinada en adobo y asada en trompo, con piña y cilantro.', icon: 'Utensils', badge: 'Estrella' },
    { title: 'Gringas y volcanes', description: 'Tortilla de harina o crujiente con queso y carne a tu gusto.', icon: 'Pizza', badge: 'Favorito' },
    { title: 'Pedidos a domicilio', description: 'Tu orden caliente y bien empacada hasta la puerta de tu casa.', icon: 'Truck', badge: 'Rápido' }
  ],
  about: {
    title: 'Tradición en cada vuelta del trompo',
    content: 'Somos una taquería familiar de Ciudad Juárez que prepara cada orden al momento.',
    metrics: [
      { label: 'Elaboración', value: 'Artesanal' },
      { label: 'Servicio', value: 'Familiar' },
      { label: 'Entrega', value: 'A domicilio' }
    ]
  },
  blog_posts: [
    { title: 'Cómo reconocer un buen taco al pastor', excerpt: 'Tres señales de que la carne se asó bien en el trompo.', read_time: '3 min', date: 'Esta semana' },
    { title: 'Salsas: qué picante va con qué taco', excerpt: 'Guía rápida para combinar salsas con tu orden.', read_time: '2 min', date: 'Hace unos días' }
  ],
  contact: { title: 'Haz tu pedido', subtitle: 'Escríbenos y te lo llevamos.', phone: '', email: '', address: '' },
  social_posts: {
    facebook: { copy: '🌮 Hoy hay pastor recién cortado. ¡Pide el tuyo!', cta: 'Ver menú' },
    instagram: { copy: 'El trompo no se detiene. 🔥 ¿Cuál es tu taco favorito?', hashtags: '#tacos #pastor #juarez #antojitos #comidamexicana' }
  },
  resumen_web: 'Sitio de la taquería Don Pastor con menú, pedidos y contacto.',
  copy_redes: '🌮 Pastor recién cortado hoy. ¡Pide el tuyo!',
  prompt_imagen: 'Close-up photo of al pastor tacos with pineapple on a taqueria counter, warm light',
  review_notes: ['El nombre "Taquería Don Pastor" lo propuso la IA.', 'No se dieron teléfono, correo ni dirección: quedaron vacíos.']
};
