import { useCallback, useEffect, useState } from 'react';
import { api, errText } from '../api';
import { Alert, PLATFORM, Tag } from '../components/ui';

const dayKey = (iso) => (iso ? new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha');
const toLocalInput = (iso) => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export default function Calendar({ setPage }) {
  const [posts, setPosts] = useState(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(0);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState('');
  const load = useCallback(() => api('GET', '/api/social').then(setPosts).catch((e) => setErr(errText(e))), []);
  useEffect(() => { load(); }, [load]);

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
  const sorted = [...posts].sort((a, b) => (a.scheduled_at ? new Date(a.scheduled_at) : Infinity) - (b.scheduled_at ? new Date(b.scheduled_at) : Infinity));
  const groups = [];
  sorted.forEach((p) => { const k = dayKey(p.scheduled_at); const g = groups.find((x) => x.k === k); if (g) g.items.push(p); else groups.push({ k, items: [p] }); });

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
      {groups.map((g) => (
        <section key={g.k} className="card stack">
          <h2 style={{ textTransform: 'capitalize' }}>{g.k}</h2>
          {g.items.map((p) => (
            <div key={p.id} className="cal-row">
              <span className="cal-plat">{PLATFORM[p.platform]}</span>
              <span className="grow cal-copy">{p.copy.slice(0, 140)}{p.copy.length > 140 ? '…' : ''}</span>
              <Tag s={p.status} />{p.auto_publish && p.status === 'APPROVED' && <span className="tag ok"><span aria-hidden="true">⏰</span>Programada</span>}
              <input type="datetime-local" aria-label={`Fecha y hora de la publicación ${p.id}`} disabled={p.status === 'PUBLISHED' || saving === p.id} value={toLocalInput(p.scheduled_at)} onChange={(e) => schedule(p, e.target.value)} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
