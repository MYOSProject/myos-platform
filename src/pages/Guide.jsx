import { useEffect, useMemo, useState } from 'react';
import { api, errText, fileToSmallDataUrl } from '../api';
import { Alert, fmt } from '../components/ui';

// Vista previa del reporte: viñetas "- " se muestran como lista, el resto como párrafos.
function Body({ text }) {
  const lines = (text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const items = [];
  let list = [];
  const flush = () => { if (list.length) { items.push(<ul key={`u${items.length}`}>{list.map((l, i) => <li key={i}>{l}</li>)}</ul>); list = []; } };
  lines.forEach((l) => {
    if (/^[-•*]\s+/.test(l)) list.push(l.replace(/^[-•*]\s+/, ''));
    else { flush(); items.push(<p key={`p${items.length}`}>{l}</p>); }
  });
  flush();
  return <>{items}</>;
}

function Brand({ onProfile }) {
  const [p, setP] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { api('GET', '/api/profile').then((d) => setP(d.profile)).catch(() => {}); }, []);
  if (!p) return null;
  const colors = p.brand_colors || { primary: '#111827', secondary: '#E2554F', accent: '#8CCFD9' };
  const save = async (patch) => {
    const next = { ...p, ...patch };
    setP(next); setSaved(false);
    try { const d = await api('PUT', '/api/profile', next); setP(d.profile); onProfile?.(d.profile); setSaved(true); } catch { /* se reintenta al volver a guardar */ }
  };
  return (
    <div className="card stack" style={{ boxShadow: 'none' }}>
      <h3>Colores y logotipo (opcional)</h3>
      <p className="muted">Se usan en las imágenes de tus publicaciones y en tu sitio. Si no los defines, uso una paleta neutra.</p>
      <div className="colors">
        {[['primary', 'Principal'], ['secondary', 'Acento'], ['accent', 'Detalle']].map(([k, l]) => (
          <div className="field" key={k}><label htmlFor={`g-${k}`}>{l}</label>
            <input id={`g-${k}`} type="color" value={colors[k]} onChange={(e) => save({ brand_colors: { ...colors, [k]: e.target.value } })} /></div>
        ))}
      </div>
      <div className="field"><label htmlFor="g-logo">Logotipo</label>
        <input id="g-logo" type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) save({ logo: await fileToSmallDataUrl(f, { max: 500, png: true }) }); }} />
        {p.logo && <img className="logo-prev" src={p.logo} alt="Tu logotipo" style={{ marginTop: 8 }} />}
      </div>
      {saved && <p className="muted" role="status">Guardado.</p>}
    </div>
  );
}

export default function Guide({ onProfile, onDone, setPage }) {
  const [view, setView] = useState(null);
  const [cur, setCur] = useState(null);
  const [answers, setAnswers] = useState({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      const v = await api('GET', '/api/guide');
      setView(v);
      setCur((c) => c || (v.steps.find((s) => s.state.status !== 'CONFIRMED') || v.steps[0]).key);
    } catch (e) { setErr(errText(e)); }
  };
  useEffect(() => { load(); }, []);

  const step = useMemo(() => view?.steps.find((s) => s.key === cur), [view, cur]);
  useEffect(() => { if (step) { setAnswers(step.state.answers); setEditing(false); setErr(''); } }, [cur, view?.steps.find((s) => s.key === cur)?.state.updated_at]); // eslint-disable-line

  if (!view) return err ? <Alert>{err}</Alert> : <p className="muted">Cargando…</p>;
  if (!step) return null;
  const idx = view.steps.findIndex((s) => s.key === cur);
  const st = step.state;
  const filled = step.questions.filter((q) => answers[q.id]?.trim()).length;
  const dirty = JSON.stringify(answers) !== JSON.stringify(st.answers);

  const run = async (name, fn) => {
    setBusy(name); setErr('');
    try { const v = await fn(); if (v) { setView(v); onDone?.(v); } } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };
  const generateAll = async () => {
    setBusy('all'); setErr('');
    try {
      let v = view;
      for (const x of v.steps) {
        if (x.state.status === 'CONFIRMED' || !x.ready) continue;
        v = await api('POST', `/api/guide/${x.key}/generate`, { answers: x.key === cur ? answers : undefined });
        setView(v);
      }
      onDone?.(v);
    } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };
  const saveAnswers = () => run('save', () => api('PUT', `/api/guide/${cur}`, { answers }));
  const generate = () => run('gen', () => api('POST', `/api/guide/${cur}/generate`, { answers }));
  const saveReport = () => run('rep', async () => { const v = await api('PUT', `/api/guide/${cur}/report`, draft); setEditing(false); return v; });
  const confirm = () => run('ok', async () => {
    const v = await api('POST', `/api/guide/${cur}/confirm`);
    const next = v.steps[idx + 1];
    if (next) setCur(next.key);
    return v;
  });

  return (
    <div className="stack">
      <div>
        <h1>Empezar paso a paso</h1>
        <p className="sub">Te voy conociendo en {view.total} pasos cortos (puedes saltarte los que no apliquen). En cada uno ves una vista previa de lo que entendí y tú decides si está bien antes de seguir. Puedes volver a cualquier paso cuando quieras.</p>
      </div>

      <div className="guide">
        <nav className="guide-nav card" aria-label="Progreso">
          <button className="btn navy" disabled={Boolean(busy) || !view.steps.some((x) => x.ready && x.state.status !== 'CONFIRMED')} onClick={generateAll}>{busy === 'all' ? 'Generando…' : 'Generar todo con IA'}</button>
          <small className="muted">Prepara la vista previa de todos los pasos que ya tienen respuestas. Después revisas y confirmas uno por uno.</small>
          <div className="bar" aria-hidden="true"><i style={{ width: `${Math.round((view.done / view.total) * 100)}%` }} /></div>
          <p className="muted">{view.done} de {view.total} pasos confirmados</p>
          {view.steps.map((s, i) => (
            <button key={s.key} className="gstep" aria-current={s.key === cur ? 'step' : undefined} onClick={() => setCur(s.key)}>
              <span className={`num ${s.state.status === 'CONFIRMED' ? 'done' : ''}`}>{s.state.status === 'CONFIRMED' ? '✓' : i + 1}</span>
              <span><b>{s.title}</b><small>{s.state.status === 'CONFIRMED' ? 'Confirmado' : s.state.status === 'DRAFT' ? 'Revisa la vista previa' : s.ready ? 'Listo para generar' : 'Por completar'}</small></span>
            </button>
          ))}
        </nav>

        <section className="stack" aria-label={step.title}>
          <div className="card stack">
            <div>
              <p className="eyebrow">Paso {idx + 1} de {view.total}</p>
              <h2>{step.title}</h2>
              <p className="muted">{step.intro}</p>
            </div>
            {step.questions.map((q) => (
              <div className="field" key={q.id}>
                <label htmlFor={`q-${q.id}`}>{q.label}</label>
                {q.help && <small className="muted">{q.help}</small>}
                {q.long
                  ? <textarea id={`q-${q.id}`} rows={3} placeholder={q.example ? `Ej.: ${q.example}` : ''} value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                  : <input id={`q-${q.id}`} type="text" placeholder={q.example ? `Ej.: ${q.example}` : ''} value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />}
              </div>
            ))}
            {step.key === 'marca' && <Brand onProfile={onProfile} />}
            <div className="row">
              <button className="btn" disabled={Boolean(busy) || filled < step.minAnswers} onClick={generate}>
                {busy === 'gen' ? 'Preparando vista previa…' : st.report ? 'Volver a generar la vista previa' : step.ai ? 'Generar vista previa con IA' : 'Ver resultado'}
              </button>
              <button className="btn secondary" disabled={Boolean(busy) || !dirty} onClick={saveAnswers}>{busy === 'save' ? 'Guardando…' : 'Guardar respuestas'}</button>
              {filled < step.minAnswers && <span className="muted">Responde al menos {step.minAnswers} pregunta{step.minAnswers > 1 ? 's' : ''} para continuar.</span>}
            </div>
            {busy === 'gen' && step.ai && <p className="muted" role="status">Gemini está escribiendo tu reporte; puede tardar unos segundos.</p>}
            <Alert>{err}</Alert>
          </div>

          {st.report && (
            <div className="card stack preview" aria-live="polite">
              <div className="row">
                <h2 className="grow">Vista previa · {step.reportTitle}</h2>
                {st.status === 'CONFIRMED' && <span className="tag ok"><span aria-hidden="true">✓</span>Confirmado</span>}
                {st.status === 'DRAFT' && <span className="tag pending"><span aria-hidden="true">⏳</span>Falta tu confirmación</span>}
              </div>
              {st.generated_by === 'ai' && <p className="muted">Escrito por IA ({st.model}) solo con tus respuestas. Revísalo: si algo no es cierto, edítalo o corrige tus respuestas.</p>}
              {editing ? (
                <div className="stack">
                  <div className="field"><label>Resumen (lo que usaré al crear contenido)</label><textarea rows={3} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} /></div>
                  {draft.sections.map((s, i) => (
                    <div className="field" key={i}>
                      <input type="text" aria-label="Título de la sección" value={s.heading} onChange={(e) => setDraft({ ...draft, sections: draft.sections.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)) })} />
                      <textarea rows={4} aria-label={`Texto de ${s.heading}`} value={s.body} onChange={(e) => setDraft({ ...draft, sections: draft.sections.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} />
                    </div>
                  ))}
                  <div className="row"><button className="btn" disabled={Boolean(busy)} onClick={saveReport}>Guardar cambios</button><button className="btn secondary" onClick={() => setEditing(false)}>Cancelar</button></div>
                </div>
              ) : (
                <>
                  {st.report.summary && <p className="summary">{st.report.summary}</p>}
                  {st.report.sections.map((s, i) => <div key={i} className="rep"><h3>{s.heading}</h3><Body text={s.body} /></div>)}
                  <p className="ask">{st.status === 'CONFIRMED' ? 'Este paso ya está confirmado.' : '¿Así está bien?'}</p>
                  <div className="row">
                    {st.status !== 'CONFIRMED' && <button className="btn" disabled={Boolean(busy) || dirty} onClick={confirm}>{busy === 'ok' ? 'Confirmando…' : idx + 1 < view.total ? 'Está bien, continuar' : 'Está bien, terminar'}</button>}
                    <button className="btn secondary" disabled={Boolean(busy)} onClick={() => { setDraft({ summary: st.report.summary, sections: st.report.sections.map((s) => ({ ...s })) }); setEditing(true); }}>Editar texto</button>
                  </div>
                  {dirty && <p className="muted">Cambiaste tus respuestas: genera de nuevo la vista previa para que lo refleje.</p>}
                  {st.confirmed_at && <p className="muted">Confirmado por {st.confirmed_by} · {fmt(st.confirmed_at)}</p>}
                </>
              )}
            </div>
          )}

          {view.complete && (
            <div className="card stack cta-card">
              <h2>¡Ya te conozco!</h2>
              <p>Con lo que me contaste puedo crear contenido que suene a ti. Siempre verás una vista previa y tú decides si se publica.</p>
              <div><button className="btn" onClick={() => setPage('create')}>Crear mi primer contenido</button></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
