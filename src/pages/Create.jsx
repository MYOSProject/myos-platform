import { useEffect, useState } from 'react';
import { api, errText } from '../api';
import { PostCard, SiteCard } from '../components/Cards';
import { Alert, PLATFORM } from '../components/ui';

const STEPS = ['Qué crear', 'Tema', 'Vista previa', 'Aprobar y publicar'];

function Progress({ n }) {
  return (
    <ol className="progress" aria-label="Pasos para crear contenido">
      {STEPS.map((s, i) => (
        <li key={s} aria-current={i + 1 === n ? 'step' : undefined} className={i + 1 < n ? 'done' : ''}>
          <span className="num">{i + 1 < n ? '✓' : i + 1}</span>{s}
        </li>
      ))}
    </ol>
  );
}

export default function Create({ profile, setPage, onSitesChanged }) {
  const [n, setN] = useState(1);
  const [kind, setKind] = useState('posts');
  const [platforms, setPlatforms] = useState(['facebook', 'instagram']);
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [ideas, setIdeas] = useState([]);
  const [posts, setPosts] = useState([]);
  const [site, setSite] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [guideDone, setGuideDone] = useState(true);

  useEffect(() => { api('GET', '/api/guide').then((g) => setGuideDone(g.done > 0)).catch(() => {}); }, []);

  const toggle = (p) => setPlatforms((x) => (x.includes(p) ? x.filter((i) => i !== p) : [...x, p]));
  const suggest = async () => {
    setBusy('ideas'); setErr('');
    try { setIdeas((await api('POST', '/api/create/ideas')).ideas); } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };
  const generate = async () => {
    setBusy('gen'); setErr('');
    try {
      if (kind === 'posts') {
        setPosts(await api('POST', '/api/create/posts', { platforms, topic, details }));
      } else {
        setSite(await api('POST', '/api/create/site', { topic }));
        onSitesChanged?.();
      }
      setN(3);
    } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };
  const restart = () => { setN(1); setPosts([]); setSite(null); setTopic(''); setDetails(''); setIdeas([]); setErr(''); };

  return (
    <div className="stack">
      <div>
        <h1>Crear contenido</h1>
        <p className="sub">Elige qué quieres, cuéntame de qué trata y revisa la vista previa. Nada se publica sin tu aprobación.</p>
      </div>
      <Progress n={n} />
      {!guideDone && <Alert kind="info">Mientras mejor te conozca, mejor escribo. <button className="btn link" onClick={() => setPage('guide')}>Completar el recorrido «Empezar»</button></Alert>}

      {n === 1 && (
        <div className="card stack">
          <h2>¿Qué quieres crear?</h2>
          <div className="choices" role="radiogroup" aria-label="Tipo de contenido">
            <button role="radio" aria-checked={kind === 'posts'} className="choice" onClick={() => setKind('posts')}><b>Publicaciones para redes</b><span>Texto e imagen para Facebook, Instagram o LinkedIn.</span></button>
            <button role="radio" aria-checked={kind === 'site'} className="choice" onClick={() => setKind('site')}><b>Página web</b><span>Un sitio de una página con tus datos y colores.</span></button>
            <button className="choice" onClick={() => setPage('library')}><b>Actualizar algo que ya creé</b><span>Abre tus contenidos y pide un cambio en lenguaje normal.</span></button>
          </div>
          {kind === 'posts' && (
            <fieldset className="plat">
              <legend>¿En qué redes?</legend>
              {Object.entries(PLATFORM).map(([k, l]) => (
                <label className="check" key={k}><input type="checkbox" checked={platforms.includes(k)} onChange={() => toggle(k)} /><span>{l}</span></label>
              ))}
            </fieldset>
          )}
          <div><button className="btn" disabled={kind === 'posts' && !platforms.length} onClick={() => setN(2)}>Continuar</button></div>
        </div>
      )}

      {n === 2 && (
        <div className="card stack">
          <h2>{kind === 'posts' ? '¿De qué quieres hablar?' : '¿Qué debe lograr tu página?'}</h2>
          <div className="field">
            <label htmlFor="topic">{kind === 'posts' ? 'Tema o idea' : 'Qué quieres que tenga o comunique'}</label>
            <textarea id="topic" rows={3} value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder={kind === 'posts' ? 'Ej.: Presentar nuestro menú de fin de semana' : 'Ej.: Quiero que me contacten por WhatsApp y vean mi menú'} />
          </div>
          {kind === 'posts' && (
            <>
              <div className="row">
                <button className="btn secondary" disabled={busy === 'ideas'} onClick={suggest}>{busy === 'ideas' ? 'Pensando ideas…' : 'Sugiéreme ideas'}</button>
                <span className="muted">Salen de lo que ya sé de tu negocio.</span>
              </div>
              {ideas.length > 0 && (
                <ul className="ideas">
                  {ideas.map((i, k) => (
                    <li key={k}><button className="idea" onClick={() => { setTopic(i.title); if (i.platform && !platforms.includes(i.platform)) setPlatforms([...platforms, i.platform]); }}>
                      <b>{i.title}</b><span>{PLATFORM[i.platform]} · {i.why}</span></button></li>
                  ))}
                </ul>
              )}
              <div className="field">
                <label htmlFor="details">Datos reales que sí puedo usar (opcional)</label>
                <small className="muted">Precios, fechas, promociones. Si no los escribes aquí, no los menciono.</small>
                <textarea id="details" rows={2} value={details} onChange={(e) => setDetails(e.target.value)} />
              </div>
            </>
          )}
          <Alert>{err}</Alert>
          <div className="row">
            <button className="btn" disabled={!topic.trim() || busy === 'gen'} onClick={generate}>{busy === 'gen' ? 'Creando vista previa…' : 'Crear vista previa'}</button>
            <button className="btn secondary" onClick={() => setN(1)}>Atrás</button>
          </div>
          {busy === 'gen' && <p className="muted" role="status">{kind === 'site' ? 'Armando tu página; puede tardar hasta un minuto.' : 'Escribiendo tus publicaciones…'}</p>}
        </div>
      )}

      {n >= 3 && (
        <div className="stack">
          <div className="card">
            <h2>Revisa la vista previa</h2>
            <p className="muted">Así se verá. Si algo no te convence, escribe qué cambiar en «Pedir un cambio» y se actualiza al momento. Cuando esté bien, aprueba y publica abajo en la misma tarjeta.</p>
          </div>
          {kind === 'posts' && (
            <div className="grid">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} profile={profile} autoImage
                  onChange={(x) => { setPosts((l) => l.map((i) => (i.id === x.id ? x : i))); if (x.status === 'PUBLISHED') setN(4); }}
                  onNewVersion={(x) => setPosts((l) => [x, ...l])}
                  onRemove={(id) => setPosts((l) => l.filter((i) => i.id !== id))} />
              ))}
            </div>
          )}
          {kind === 'site' && site && <SiteCard site={site} defaultOpen onChange={(x) => { setSite(x); if (x.status === 'APPROVED' || x.status === 'PUBLISHED') setN(4); onSitesChanged?.(); }} onAskChanges={() => setPage('chat')} />}
          <div className="row">
            <button className="btn secondary" onClick={restart}>Crear otro contenido</button>
            <button className="btn link" onClick={() => setPage('library')}>Ver todos mis contenidos</button>
          </div>
        </div>
      )}
    </div>
  );
}
