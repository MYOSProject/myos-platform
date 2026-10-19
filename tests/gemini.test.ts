import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import { geminiError, geminiOk, SAMPLE_SITE, startMockGemini } from './helpers.ts';

process.env.GEMINI_API_KEY = 'test-key-1234567890abcdef';
const { generateSite, AiFailure, normalizeSite, copiesBrief, classifyError, DEFAULT_MODELS } = await import('../server/gemini.ts');

const FAST = { backoffMs: 1, requestTimeoutMs: 4000 };
let mock: Awaited<ReturnType<typeof startMockGemini>>;
let script: (n: number, model: string) => { status: number; body: any };

before(async () => {
  mock = await startMockGemini((req, n) => {
    const model = /models\/([^:]+):/.exec(req.url)?.[1] || '';
    return script(n, model);
  });
  process.env.GEMINI_BASE_URL = mock.url;
});
after(async () => {
  await mock.close();
});

const reset = () => (mock.requests.length = 0);
const BRIEF = 'Taquería de tacos al pastor en Ciudad Juárez con servicio a domicilio, colores rojo y negro';

test('los modelos por defecto son los vigentes y existen en la documentación de Google', () => {
  assert.deepEqual(DEFAULT_MODELS, ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']);
});

test('éxito al primer intento: sitio normalizado, metadatos y forma de la petición', async () => {
  reset();
  script = () => geminiOk(SAMPLE_SITE);
  const { site, ai } = await generateSite({ brief: BRIEF }, FAST);
  assert.equal(ai.source, 'gemini');
  assert.equal(ai.model, 'gemini-3.8-flash');
  assert.equal(ai.attempts.length, 1);
  assert.equal(site.site_name, 'Taquería Don Pastor');
  assert.equal(site.services.length, 3);
  assert.equal(site.contact.phone, '');

  const sent = mock.requests[0];
  assert.match(sent.url, /models\/gemini-3\.8-flash:generateContent/);
  assert.equal(sent.headers['x-goog-api-key'], 'test-key-1234567890abcdef');
  // Las reglas van en systemInstruction; el brief va como DATO en el mensaje de usuario.
  const sys = JSON.stringify(sent.body.systemInstruction);
  assert.match(sys, /NUNCA copies/);
  assert.match(sys, /NO inventes datos verificables/);
  assert.ok(!sys.includes('Ciudad Juárez'), 'el brief del cliente no debe ir en systemInstruction');
  assert.match(JSON.stringify(sent.body.contents), /Ciudad Juárez/);
  assert.equal(sent.body.generationConfig.responseMimeType, 'application/json');
  assert.ok(sent.body.generationConfig.responseJsonSchema?.properties?.hero, 'debe pedir salida estructurada');
});

test('503 transitorio: un reintento y, si sigue saturado, pasa al siguiente modelo', async () => {
  reset();
  script = (n) => (n < 3 ? geminiError(503, 'The model is overloaded. Please try again later.', 'UNAVAILABLE') : geminiOk(SAMPLE_SITE));
  const { ai } = await generateSite({ brief: BRIEF }, FAST);
  assert.equal(ai.model, 'gemini-3.6-flash');
  assert.deepEqual(ai.attempts.map((a) => a.code ?? 'ok'), ['OVERLOADED', 'OVERLOADED', 'ok']);
});

test('503 de un solo golpe: el reintento al mismo modelo lo recupera', async () => {
  reset();
  script = (n) => (n < 2 ? geminiError(503, 'overloaded', 'UNAVAILABLE') : geminiOk(SAMPLE_SITE));
  const { ai } = await generateSite({ brief: BRIEF }, FAST);
  assert.equal(ai.model, 'gemini-3.8-flash');
});

test('modelo inexistente (404): pasa al siguiente modelo de la lista', async () => {
  reset();
  script = (_n, model) => (model === 'gemini-3.8-flash' ? geminiError(404, 'models/gemini-3.8-flash is not found for API version v1beta', 'NOT_FOUND') : geminiOk(SAMPLE_SITE));
  const { ai } = await generateSite({ brief: BRIEF }, FAST);
  assert.equal(ai.model, 'gemini-3.6-flash');
  assert.equal(ai.attempts[0].code, 'MODEL_NOT_FOUND');
});

test('cuota agotada (429) en todos los modelos: error QUOTA visible, con pista y sin reintentos inútiles', async () => {
  reset();
  script = () => geminiError(429, 'You exceeded your current quota', 'RESOURCE_EXHAUSTED');
  await assert.rejects(generateSite({ brief: BRIEF }, FAST), (e: any) => {
    assert.ok(e instanceof AiFailure);
    assert.equal(e.code, 'QUOTA');
    assert.match(e.ai.error.hint, /cuota/i);
    assert.equal(e.ai.source, 'fallback');
    return true;
  });
  assert.equal(mock.requests.length, 4, 'un intento por modelo, sin esperar en 429');
});

test('llave inválida (400 API key not valid): falla de inmediato, sin probar otros modelos', async () => {
  reset();
  script = () => geminiError(400, 'API key not valid. Please pass a valid API key.', 'INVALID_ARGUMENT');
  await assert.rejects(generateSite({ brief: BRIEF }, FAST), (e: any) => e.code === 'INVALID_API_KEY');
  assert.equal(mock.requests.length, 1);
});

test('JSON roto: reintenta y, si persiste, devuelve BAD_JSON (no inventa contenido)', async () => {
  reset();
  script = () => geminiOk('{"titulo": "incompleto", ');
  await assert.rejects(generateSite({ brief: BRIEF }, FAST), (e: any) => e.code === 'BAD_JSON');
  assert.ok(mock.requests.length >= 3);
});

test('JSON con bloque ```json se acepta', async () => {
  reset();
  script = () => geminiOk('```json\n' + JSON.stringify(SAMPLE_SITE) + '\n```');
  const { site } = await generateSite({ brief: BRIEF }, FAST);
  assert.equal(site.site_name, 'Taquería Don Pastor');
});

test('si el modelo copia el brief en el título, se repite la solicitud', async () => {
  reset();
  const copied = { ...SAMPLE_SITE, hero: { ...SAMPLE_SITE.hero, title: BRIEF } };
  script = (n) => geminiOk(n === 1 ? copied : SAMPLE_SITE);
  const { site, ai } = await generateSite({ brief: BRIEF }, FAST);
  assert.equal(site.hero.title, 'El sabor del trompo, en cada taco');
  assert.equal(ai.attempts.length, 2);
});

test('bloqueo de seguridad: SAFETY_BLOCK sin reintentos', async () => {
  reset();
  script = () => ({ status: 200, body: { promptFeedback: { blockReason: 'SAFETY' }, candidates: [] } });
  await assert.rejects(generateSite({ brief: BRIEF }, FAST), (e: any) => e.code === 'SAFETY_BLOCK');
  assert.equal(mock.requests.length, 1);
});

test('refinamiento: el sitio actual viaja en el mensaje y las instrucciones cambian a MODO AJUSTE', async () => {
  reset();
  script = () => geminiOk({ ...SAMPLE_SITE, brand_colors: { primary: '#7c3aed', secondary: '#1b1b1b', accent: '#ddd6fe' } });
  const { site } = await generateSite({ brief: 'cámbialo a color morado', previousSite: SAMPLE_SITE }, FAST);
  assert.equal(site.brand_colors.primary, '#7c3aed');
  assert.match(JSON.stringify(mock.requests[0].body.systemInstruction), /MODO AJUSTE/);
  assert.match(JSON.stringify(mock.requests[0].body.contents), /Taquería Don Pastor/);
});

test('sin llave: NO_API_KEY inmediato, sin red', async () => {
  reset();
  const saved = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = '';
  delete process.env.GOOGLE_API_KEY;
  try {
    await assert.rejects(generateSite({ brief: BRIEF }, FAST), (e: any) => e.code === 'NO_API_KEY' && /GEMINI_API_KEY/.test(e.ai.error.hint));
    assert.equal(mock.requests.length, 0);
  } finally {
    process.env.GEMINI_API_KEY = saved;
  }
});

test('un valor de relleno como llave se trata como ausente', async () => {
  const saved = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'MY_GEMINI_API_KEY';
  try {
    await assert.rejects(generateSite({ brief: BRIEF }, FAST), (e: any) => e.code === 'NO_API_KEY');
  } finally {
    process.env.GEMINI_API_KEY = saved;
  }
});

test('normalizeSite: limpia HTML, colores, iconos, correos y límites', () => {
  const dirty: any = JSON.parse(JSON.stringify(SAMPLE_SITE));
  dirty.site_name = '<script>alert(1)</script>Mi Negocio';
  dirty.brand_colors = { primary: 'red; background:url(javascript:1)', secondary: '#abc', accent: 'nope' };
  dirty.services[0].icon = 'NoExiste';
  dirty.contact = { title: 't', subtitle: 's', phone: 'llama al 656-123-4567 <b>ya</b>', email: 'no-es-correo', address: 'Calle 1' };
  dirty.services.push(...Array.from({ length: 10 }, (_, i) => ({ title: 'S' + i, description: 'd' + i, icon: 'Star', badge: '' })));
  const site = normalizeSite(dirty);
  assert.equal(site.site_name, 'alert(1)Mi Negocio');
  assert.ok(!/[<>]/.test(site.site_name));
  assert.equal(site.brand_colors.primary, '#e8504a');
  assert.equal(site.brand_colors.secondary, '#aabbcc');
  assert.equal(site.brand_colors.accent, '#f4b6b3');
  assert.equal(site.services[0].icon, 'Sparkles');
  assert.equal(site.services.length, 6);
  assert.equal(site.contact.email, '');
  assert.equal(site.contact.phone, '656-123-4567');
  assert.match(site.social_posts.instagram.hashtags, /^#tacos #pastor/);
});

test('normalizeSite rechaza respuestas incompletas', () => {
  assert.throws(() => normalizeSite({ site_name: 'X' }), /obligatorios/);
  assert.throws(() => normalizeSite(null));
});

test('copiesBrief detecta el copiado literal', () => {
  const site = normalizeSite(SAMPLE_SITE);
  assert.equal(copiesBrief(site, BRIEF), false);
  assert.equal(copiesBrief({ ...site, hero: { ...site.hero, title: `Líderes en ${BRIEF}` } }, BRIEF), true);
});

test('classifyError reconoce los casos de la API', () => {
  assert.equal(classifyError({ status: 503, message: 'x' }).code, 'OVERLOADED');
  assert.equal(classifyError({ status: 429, message: 'x' }).code, 'QUOTA');
  assert.equal(classifyError({ status: 404, message: 'x' }).code, 'MODEL_NOT_FOUND');
  assert.equal(classifyError({ status: 403, message: 'x' }).code, 'INVALID_API_KEY');
  assert.equal(classifyError(new TypeError('fetch failed')).code, 'NETWORK');
  assert.equal(classifyError({ name: 'AbortError', message: 'aborted' }).code, 'TIMEOUT');
});
