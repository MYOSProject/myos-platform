import { useState } from 'react';

function App() {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [approvedSuccess, setApprovedSuccess] = useState(false);

  const BACKEND_URL = 'https://myos-platform.onrender.com/api'; // O http://127.0.0.1:8000/api en local

  // 1. Enviar brief a la IA
  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setLoading(true);
    setApprovedSuccess(false);

    try {
      const res = await fetch(`${BACKEND_URL}/generate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief })
      });
      const data = await res.json();
      if (res.ok) {
        setProposal(data);
      } else {
        alert(data.error || 'Error al generar propuesta');
      }
    } catch (err) {
      console.error(err);
      alert('Error conectando con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // 2. Aprobar propuesta
  const handleApprove = async () => {
    if (!proposal) return;
    try {
      const res = await fetch(`${BACKEND_URL}/approve/${proposal.id}/`, {
        method: 'POST'
      });
      if (res.ok) {
        setApprovedSuccess(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-blue-500">🧠 Cerebro Digital — Generador & Aprobación</h1>
          <p className="text-slate-400 text-sm mt-1">
            Genera borradores con IA. Ningún contenido se publica hasta que presiones <strong>Aprobar</strong>.
          </p>
        </header>

        {/* Formulario de Entrada */}
        <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
          <label className="block text-sm font-medium text-slate-300">
            ¿Qué contenido deseas generar hoy?
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Ej: Hazme una promoción para una cafetería que ofrece 2x1 en capuchinos los viernes..."
            className="w-full h-28 p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !brief.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 font-semibold rounded-lg transition"
          >
            {loading ? 'Pensando propuesta con IA...' : 'Generar Propuesta'}
          </button>
        </section>

        {/* Vista Previa de la Propuesta (Estado PENDING) */}
        {proposal && (
          <section className="bg-slate-800/80 p-6 rounded-xl border border-blue-500/30 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                ESTADO: {approvedSuccess ? 'APROBADO' : 'PENDIENTE DE APROBACIÓN'}
              </span>
              <span className="text-xs text-slate-400">ID Registro: #{proposal.id}</span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Título Web</h3>
                <p className="text-lg font-bold text-white">{proposal.content.titulo}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resumen para Web</h3>
                <p className="text-slate-300 text-sm mt-1">{proposal.content.resumen_web}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Copy Redes Sociales</h3>
                <p className="text-slate-300 text-sm bg-slate-900 p-3 rounded border border-slate-700 mt-1 whitespace-pre-line">
                  {proposal.content.copy_redes}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sugerencia / Prompt de Imagen</h3>
                <p className="text-xs font-mono text-blue-300 bg-blue-950/40 p-3 rounded border border-blue-800/50 mt-1">
                  🎨 {proposal.content.prompt_imagen}
                </p>
              </div>
            </div>

            {/* Botones de Acción */}
            {!approvedSuccess ? (
              <div className="flex gap-4 pt-4 border-t border-slate-700">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 font-semibold rounded-lg transition"
                >
                  🔄 Volver a generar (Regenerar)
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg transition"
                >
                  ✅ Aprobar y Publicar
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-lg text-emerald-300 text-center text-sm font-semibold">
                ¡Contenido Aprobado con éxito! Ya está disponible en la API para publicarse en la web o redes.
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}

export default App;