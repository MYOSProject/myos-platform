import { useEffect, useState } from 'react';
import { api, errText, fileToSmallDataUrl } from '../api';
import { Alert } from '../components/ui';

const FIELDS = [
  ['business_name', 'Nombre del negocio', 'text'],
  ['what_they_do', 'A qué se dedica', 'area'],
  ['industry', 'Giro', 'text'],
  ['audience', 'Público objetivo', 'area'],
  ['location', 'Ubicación / zona de servicio', 'text'],
  ['value_proposition', 'Qué te hace diferente', 'area'],
  ['offers', 'Productos, servicios u ofertas', 'area'],
  ['tone', 'Tono de comunicación (cercano, formal, divertido…)', 'text'],
  ['goals', 'Objetivos (más pedidos, más clientes, dar a conocer…)', 'area'],
  ['channels', 'Canales donde quieres publicar', 'text'],
  ['phone', 'Teléfono / WhatsApp', 'text'],
  ['email', 'Correo de contacto', 'text'],
  ['address', 'Dirección', 'text'],
  ['hours', 'Horario', 'text'],
  ['website', 'Sitio web actual', 'text'],
  ['notes', 'Otras notas para el asistente', 'area']
];

export default function Business({ onProfile }) {
  const [form, setForm] = useState(null);
  const [info, setInfo] = useState({ completeness: 0, missing: [] });
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('GET', '/api/profile').then((d) => {
      setForm({ ...d.profile, brand_colors: d.profile.brand_colors || null });
      setInfo(d);
    }).catch((e) => setErr(errText(e)));
  }, []);
  if (!form) return err ? <Alert>{err}</Alert> : <p className="muted">Cargando…</p>;

  const set = (k, v) => { setSaved(false); setForm((f) => ({ ...f, [k]: v })); };
  const colors = form.brand_colors || { primary: '#111827', secondary: '#E2554F', accent: '#8CCFD9' };
  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = { ...form, brand_colors: form.brand_colors, logo: form.logo || '' };
      const d = await api('PUT', '/api/profile', body);
      setForm(d.profile); setInfo(d); onProfile?.(d.profile); setSaved(true);
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };
  const pickLogo = async (e) => {
    const f = e.target.files?.[0];
    if (f) set('logo', await fileToSmallDataUrl(f, { max: 500, png: true }));
  };

  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <div>
        <h1>Mi negocio</h1>
        <p className="sub">Esto es lo que el asistente sabe de ti y usa para crear tu contenido. Puedes completarlo aquí o simplemente conversando con él.</p>
      </div>
      <div className="card stack">
        <div className="bar"><i style={{ width: `${info.completeness}%` }} /></div>
        <p className="muted">{info.completeness}% de lo esencial{info.missing.length ? ` · falta: ${info.missing.join(', ')}` : ' · ¡listo!'}</p>
      </div>
      <div className="card stack">
        {FIELDS.map(([k, label, type]) => (
          <div className="field" key={k}>
            <label htmlFor={k}>{label}</label>
            {type === 'area' ? <textarea id={k} value={form[k] || ''} onChange={(e) => set(k, e.target.value)} /> : <input id={k} type="text" value={form[k] || ''} onChange={(e) => set(k, e.target.value)} />}
          </div>
        ))}
      </div>
      <div className="card stack">
        <h2>Marca</h2>
        <p className="muted">Se usan en tu sitio y en las imágenes de tus publicaciones. Si no los defines, el asistente usa una paleta neutra.</p>
        <div className="colors">
          {[['primary', 'Principal (fondo)'], ['secondary', 'Acento (botones)'], ['accent', 'Detalle']].map(([k, l]) => (
            <div className="field" key={k}><label htmlFor={`c-${k}`}>{l}</label>
              <input id={`c-${k}`} type="color" value={colors[k]} onChange={(e) => set('brand_colors', { ...colors, [k]: e.target.value })} /></div>
          ))}
          {form.brand_colors && <button className="btn link" onClick={() => set('brand_colors', null)}>Quitar colores</button>}
        </div>
        <div className="field"><label htmlFor="logo">Logotipo</label>
          <input id="logo" type="file" accept="image/*" onChange={pickLogo} />
          {form.logo && <div className="row" style={{ marginTop: 8 }}><img className="logo-prev" src={form.logo} alt="Tu logotipo" /><button className="btn link" onClick={() => set('logo', null)}>Quitar</button></div>}
        </div>
      </div>
      <Alert>{err}</Alert>
      {saved && <Alert kind="ok">Guardado. El asistente ya usa estos datos.</Alert>}
      <div><button className="btn" disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar'}</button></div>
    </div>
  );
}
