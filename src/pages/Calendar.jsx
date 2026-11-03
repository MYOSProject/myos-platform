import { useCallback, useEffect, useState } from 'react';
import { api, errText } from '../api';
import { PostCard } from '../components/Cards';
import { Alert, PLATFORM, Tag } from '../components/ui';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hora = (iso) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
const CHIP = { facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn', x: 'X' };
// Semanas del mes (lunes a domingo); incluye los días sobrantes de los meses vecinos para completar la cuadrícula.
function weeksOf(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - ((first.getDay() + 6) % 7));
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let i = 0; i < 7; i++) row.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i));
    if (w >= 4 && row[0].getMonth() !== month) break;
    weeks.push(row);
  }
  return weeks;
}
const toLocalInput = (iso) => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export default function Calendar({ profile, setPage }) {
  const [posts, setPosts] = useState(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(0);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState('');
  const hoy = new Date();
  const [cursor, setCursor] = useState({ y: hoy.getFullYear(), m: hoy.getMonth() });
  const [sel, setSel] = useState(null);
  const [centered, setCentered] = useState(false);
  const load = useCallback(() => api('GET', '/api/social').then(setPosts).catch((e) => setErr(errText(e))), []);
  useEffect(() => { load(); }, [load]);
  // La primera vez se abre el mes de la publicación más cercana a hoy (o el actual si no hay ninguna).
  useEffect(() => {
    if (!posts || centered) return;
    setCentered(true);
    const now = new Date();
    const next = posts.filter((p) => p.scheduled_at).map((p) => new Date(p.scheduled_at)).sort((x, y) => Math.abs(x - now) - Math.abs(y - now))[0];
    if (next) setCursor({ y: next.getFullYear(), m: next.getMonth() });
  }, [posts, centered]);

  const schedule = async (p, value) => {
    setSaving(p.id); setErr('');
    try {
      const n = await api('PUT', `/api/social/${p.id}`, { scheduled_at: value ? new Date(value).toISOString() : null });
      setPosts((l) => l.map((x) => (x.id === n.id ? n : x)));
    } catch (e) { setErr(errText(e)); } finally { setSaving(0); }
  };

  const runDue = async () => {
    setRunning(true); setErr(''); setNote('');
    try {
      const r = await api('POST', '/api/schedule/run');
      setNote(r.checked ? `Se revisaron ${r.checked}: ${r.published} publicadas, ${r.skipped} en simulación, ${r.failed} con error.${r.details.length ? ` ${r.details.join(' · ')}` : ''}` : 'No hay nada programado cuya hora ya haya llegado.');
      await load();
    } catch (e) { setErr(errText(e)); } finally { setRunning(false); }
  };

  if (!posts) return err ? <Alert>{err}</Alert> : <p className="muted">Cargando…</p>;
  const byDay = {};
  const undated = [];
  posts.forEach((p) => { if (!p.scheduled_at) undated.push(p); else { const k = ymd(new Date(p.scheduled_at)); (byDay[k] = byDay[k] || []).push(p); } });
  Object.values(byDay).forEach((l) => l.sort((x, y) => new Date(x.scheduled_at) - new Date(y.scheduled_at)));
  const move = (n) => { const d = new Date(cursor.y, cursor.m + n, 1); setCursor({ y: d.getFullYear(), m: d.getMonth() }); setSel(null); };
  const weeks = weeksOf(cursor.y, cursor.m);
  const todayKey = ymd(hoy);
  const selected = sel ? posts.find((p) => p.id === sel) : null;
  const inMonth = posts.filter((p) => p.scheduled_at && new Date(p.scheduled_at).getFullYear() === cursor.y && new Date(p.scheduled_at).getMonth() === cursor.m).length;

  const detail = (p) => (
    <div key={p.id} className="stack cal-detail" style={{ maxWidth: 640 }}>
      <div className="row">
        <b className="grow">{PLATFORM[p.platform]}{p.scheduled_at ? ` · ${new Date(p.scheduled_at).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}` : ' · Sin fecha'}</b>
        <button className="btn secondary" onClick={() => setSel(null)}>Cerrar</button>
      </div>
      <label className="row muted">Fecha y hora:
        <input type="datetime-local" aria-label={`Fecha y hora de la publicación ${p.id}`} disabled={p.status === 'PUBLISHED' || saving === p.id} value={toLocalInput(p.scheduled_at)} onChange={(e) => schedule(p, e.target.value)} />
      </label>
      <PostCard post={p} profile={profile}
        onChange={(n) => setPosts((l) => l.map((x) => (x.id === n.id ? n : x)))}
        onNewVersion={(n) => { setPosts((l) => [n, ...l]); setSel(n.id); }}
        onRemove={(id) => { setPosts((l) => l.filter((x) => x.id !== id)); setSel(null); }} />
    </div>
  );

  return (
    <div className="stack">
      <div>
        <h1>Calendario editorial</h1>
        <p className="sub">Fecha y hora planeada de cada publicación, con su estado. La fecha es una guía de planeación: <b>publicar siempre requiere tu aprobación</b> en «Contenido con IA».</p>
      </div>
      <div className="card row">
        <span className="grow muted">Las publicaciones aprobadas con «Aprobar y programar» salen solas a su hora. Aquí puedes adelantar la revisión.</span>
        <button className="btn secondary" disabled={running} onClick={runDue}>{running ? 'Revisando…' : 'Publicar lo programado que ya venció'}</button>
      </div>
      <Alert kind="ok">{note}</Alert>
      <Alert>{err}</Alert>
      {!posts.length && <div className="card"><p className="muted">Aún no hay publicaciones en este proyecto.</p><button className="btn" onClick={() => setPage('content')}>Generar contenido con IA</button></div>}
      <section className="card stack" aria-label="Calendario mensual">
        <div className="row cal-nav">
          <button className="btn secondary" onClick={() => move(-1)} aria-label="Mes anterior">←</button>
          <h2 className="grow cal-title">{MESES[cursor.m]} {cursor.y}</h2>
          <button className="btn secondary" onClick={() => { setCursor({ y: hoy.getFullYear(), m: hoy.getMonth() }); setSel(null); }}>Hoy</button>
          <button className="btn secondary" onClick={() => move(1)} aria-label="Mes siguiente">→</button>
        </div>
        <div className="cal-scroll">
          <div className="cal-grid" role="grid" aria-label={`${MESES[cursor.m]} ${cursor.y}`}>
            {DIAS.map((d) => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
            {weeks.flat().map((day) => {
              const k = ymd(day); const list = byDay[k] || []; const out = day.getMonth() !== cursor.m;
              return (
                <div key={k} role="gridcell" className={`cal-cell${out ? ' out' : ''}${k === todayKey ? ' today' : ''}`}>
                  <span className="cal-num">{day.getDate()}</span>
                  {list.map((p) => (
                    <button key={p.id} type="button" className={`cal-chip st-${p.status.toLowerCase()}${sel === p.id ? ' on' : ''}`} onClick={() => setSel(p.id)}
                      aria-label={`${PLATFORM[p.platform]}, ${hora(p.scheduled_at)}, ${p.status}`} title={p.copy.slice(0, 120)}>
                      <b>{CHIP[p.platform]}</b> <span>{hora(p.scheduled_at)}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <p className="muted cal-legend">{inMonth ? `${inMonth} publicación(es) este mes.` : 'No hay publicaciones este mes.'} Toca una para verla, cambiar su tono o fecha y autorizarla. <span className="cal-key st-draft">Borrador</span> <span className="cal-key st-pending_approval">Pendiente</span> <span className="cal-key st-approved">Aprobada</span> <span className="cal-key st-published">Publicada</span></p>
      </section>
      {selected && detail(selected)}
      {undated.length > 0 && (
        <section className="card stack">
          <h2>Sin fecha</h2>
          {undated.map((p) => (
            <div key={p.id} className="cal-row">
              <span className="cal-plat">{PLATFORM[p.platform]}</span>
              <span className="grow cal-copy">{p.copy.slice(0, 140)}{p.copy.length > 140 ? '…' : ''}</span>
              <Tag s={p.status} />
              <input type="datetime-local" aria-label={`Fecha y hora de la publicación ${p.id}`} disabled={p.status === 'PUBLISHED' || saving === p.id} value={toLocalInput(p.scheduled_at)} onChange={(e) => schedule(p, e.target.value)} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
