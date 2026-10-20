import { useEffect, useState } from 'react';
import { api, errText } from '../api';
import { Alert, fmt } from '../components/ui';

export default function Projects({ activeId, onOpen, onList, setPage }) {
  const [list, setList] = useState(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const apply = (d) => { setList(d.projects); onList?.(d.projects); };
  useEffect(() => { api('GET', '/api/projects').then(apply).catch((e) => setErr(errText(e))); }, []); // eslint-disable-line

  const create = async () => {
    setBusy('new'); setErr('');
    try {
      const d = await api('POST', '/api/projects', { name, description: desc });
      apply(d); setCreating(false); setName(''); setDesc('');
      onOpen(d.project, 'guide');
    } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };
  const rename = async () => {
    setBusy('ren'); setErr('');
    try { apply(await api('PUT', `/api/projects/${editing.id}`, { name: editing.name, description: editing.description })); setEditing(null); }
    catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };
  const remove = async (p) => {
    if (!window.confirm(`¿Borrar el proyecto «${p.name}» con todo su contenido sin aprobar? No se puede deshacer.`)) return;
    setBusy(`del${p.id}`); setErr('');
    try { apply(await api('DELETE', `/api/projects/${p.id}`)); } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };

  if (!list) return err ? <Alert>{err}</Alert> : <p className="muted">Cargando…</p>;
  return (
    <div className="stack">
      <div>
        <h1>Mis proyectos</h1>
        <p className="sub">Cada proyecto es un negocio o cliente con su propia información, contenidos y conexión a redes. Elige uno para trabajar o crea uno nuevo.</p>
      </div>
      <div className="row">
        <button className="btn" onClick={() => setCreating((c) => !c)}>{creating ? 'Cancelar' : '+ Crear proyecto'}</button>
      </div>
      {creating && (
        <div className="card stack">
          <h2>Nuevo proyecto</h2>
          <div className="field"><label htmlFor="pn">Nombre del proyecto</label><input id="pn" type="text" autoFocus value={name} placeholder="Ej.: Taquería Don Pastor" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) create(); }} /></div>
          <div className="field"><label htmlFor="pd">Descripción (opcional)</label><input id="pd" type="text" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div><button className="btn" disabled={!name.trim() || busy === 'new'} onClick={create}>{busy === 'new' ? 'Creando…' : 'Crear y empezar'}</button></div>
        </div>
      )}
      <Alert>{err}</Alert>
      <div className="grid">
        {list.map((p) => (
          <article className="piece" key={p.id} aria-current={p.id === activeId ? 'true' : undefined} style={p.id === activeId ? { borderColor: 'var(--navy)' } : undefined}>
            <div className="piece-head"><span className="grow">{p.name}</span>{p.id === activeId && <span className="tag ok"><span aria-hidden="true">●</span>Abierto</span>}</div>
            <div className="piece-body">
              {editing?.id === p.id ? (
                <div className="stack" style={{ gap: 12 }}>
                  <div className="field"><label>Nombre</label><input type="text" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                  <div className="field"><label>Descripción</label><input type="text" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
                  <div className="row"><button className="btn" disabled={busy === 'ren'} onClick={rename}>Guardar</button><button className="btn secondary" onClick={() => setEditing(null)}>Cancelar</button></div>
                </div>
              ) : (
                <>
                  {p.description && <p>{p.description}</p>}
                  <div className="meter" role="img" aria-label={`Recorrido ${p.steps_confirmed} de 8 pasos`}><i style={{ width: `${(p.steps_confirmed / 8) * 100}%` }} /></div>
                  <p className="next">{p.steps_confirmed === 0 ? 'Siguiente: cuéntale a la IA de tu negocio en «Empezar».' : p.steps_confirmed < 8 ? `Siguiente: terminar el recorrido (${8 - p.steps_confirmed} pasos más) para que la IA te conozca mejor.` : p.posts === 0 ? 'Siguiente: dejar que la IA genere tu contenido.' : p.posts_pending ? `Siguiente: revisar y aprobar ${p.posts_pending} publicaciones.` : 'Todo al día. La IA puede preparar contenido nuevo.'}</p>
                  <ul className="stats">
                    <li><b>{p.steps_confirmed}</b> pasos confirmados</li>
                    <li><b>{p.posts}</b> publicaciones{p.posts_pending ? ` (${p.posts_pending} por revisar)` : ''}</li>
                    <li><b>{p.posts_published}</b> publicadas</li>
                    <li>{p.sites || 0} sitios web</li>
                    <li>{p.connected ? 'Redes conectadas ✓' : 'Redes en simulación'}</li>
                  </ul>
                  <p className="muted">Actualizado {fmt(p.updated_at)}</p>
                  <div className="row">
                    <button className="btn" onClick={() => onOpen(p, 'guide')}>Abrir y empezar</button>
                    <button className="btn secondary small" onClick={() => setEditing({ id: p.id, name: p.name, description: p.description })}>Editar</button>
                    <button className="btn link" disabled={busy === `del${p.id}`} onClick={() => remove(p)}>Borrar</button>
                  </div>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
