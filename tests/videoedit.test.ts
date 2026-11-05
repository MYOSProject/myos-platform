import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { geminiOk, startMockGemini } from './helpers.ts';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'myos-vid-'));
process.env.AUTH_MODE = 'dev';
process.env.DATA_FILE = path.join(tmp, 'db.json');
process.env.SEED_DEMO_DATA = 'false';
process.env.GEMINI_API_KEY = 'test-key-1234567890abcdef';
process.env.RATE_LIMIT_SCALE = '1000';
process.env.AI_REQUEST_TIMEOUT_MS = '3000';

let plan: any = {};
const gemini = await startMockGemini(() => geminiOk(plan));
process.env.GEMINI_BASE_URL = gemini.url;
const { createApp } = await import('../server/app.ts');
const { getStore } = await import('../server/store.ts');

let server: import('http').Server;
let base = '';
before(async () => {
  server = await new Promise((resolve) => { const x = createApp().listen(0, '127.0.0.1', () => resolve(x)); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  await gemini.close();
  getStore().flush();
  fs.rmSync(tmp, { recursive: true, force: true });
});

const JPG = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64');
const frames = [{ t: 2, data: JPG }, { t: 8, data: JPG }, { t: 14, data: JPG }];
async function post(body: any) {
  const res = await fetch(`${base}/api/video/autoedit`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-dev-user': 'ana@merkatics.com' }, body: JSON.stringify(body) });
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch { /* no json */ }
  return { status: res.status, json, text };
}

test('edición con IA: valida la duración, los fotogramas y el audio', async () => {
  assert.equal((await post({ duration: 1, frames })).status, 400);
  assert.equal((await post({ duration: 500, frames })).status, 400);
  assert.equal((await post({ duration: 20, frames: [] })).status, 400);
  assert.equal((await post({ duration: 20, frames: [{ t: 1, data: 'http://malo' }, { t: 2, data: 'data:text/html;base64,AAAA' }] })).status, 400);
  assert.equal((await post({ duration: 20, frames, audio_b64: '<script>' })).status, 400);
});

test('edición con IA: limpia el plan (recorte, subtítulos ordenados y sin traslapes, textos acotados) y manda fotogramas y audio a la IA', async () => {
  plan = {
    title: 'Así quedó el sitio de Doña Lupe y mucho más texto que sobra para pasar el límite', subtitle: '', cta: '', trim_start: -5, trim_end: 999, focus_x: 3, font: 'rara', heard_speech: true, summary: 'Quité el inicio y puse subtítulos.',
    captions: [
      { start: 9, end: 12, text: 'Segunda frase' },
      { start: 1, end: 5, text: 'Primera frase' },
      { start: 4, end: 4.1, text: 'demasiado corta' },
      { start: 10, end: 11, text: 'Queda dentro de la segunda: se descarta' },
      { start: 2, end: 3, text: '' }
    ]
  };
  const r = await post({ duration: 20, frames, audio_b64: 'AAAA', brief: 'testimonio', format: '9:16' });
  assert.equal(r.status, 200, r.text);
  const p = r.json.plan;
  assert.ok(p.title.length <= 50);
  assert.equal(p.trim_start, 0);
  assert.ok(p.trim_end <= 20 && p.trim_end - p.trim_start <= 60);
  assert.equal(p.focus_x, 1);
  assert.equal(p.font, 'moderna');
  assert.equal(p.cta, 'Escríbenos hoy');
  assert.deepEqual(p.captions.map((c: any) => c.text), ['Primera frase', 'Segunda frase']);
  for (let i = 1; i < p.captions.length; i++) assert.ok(p.captions[i].start >= p.captions[i - 1].end - 1e-9, 'sin traslapes');
  assert.equal(p.heard_speech, true);
  const sent = JSON.stringify(gemini.requests.at(-1)!.body);
  assert.ok(sent.includes('audio/wav') && sent.includes('image/jpeg'));
});

test('edición con IA: sin subtítulos no dice que escuchó a alguien', async () => {
  plan = { title: 'Mira esto', cta: 'Visítanos', trim_start: 1, trim_end: 10, focus_x: 0.4, font: 'fuerte', captions: [], heard_speech: true, summary: 'Listo.' };
  const r = await post({ duration: 12, frames });
  assert.equal(r.json.plan.heard_speech, false);
  assert.equal(r.json.plan.font, 'fuerte');
});
