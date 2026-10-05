import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [contents, setContents] = useState([]);
  const [brand, setBrand] = useState(null);
  const [inicio, setInicio] = useState(null);
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    // Reemplaza por la URL real de tu backend si estás en producción
    fetch('https://myos-platform.onrender.com/api/content/')
      .then((res) => res.json())
      .then((data) => {
        setContents(data);

        // 1. Extraer Guía de Marca si existe
        const brandItem = data.find((item) => item.title.includes('guia_marca'));
        if (brandItem) {
          try { setBrand(JSON.parse(brandItem.body_text)); } catch (e) {}
        }

        // 2. Extraer Configuración de Inicio
        const inicioItem = data.find((item) => item.title.includes('inicio'));
        if (inicioItem) {
          try { setInicio(JSON.parse(inicioItem.body_text)); } catch (e) {}
        }

        // 3. Extraer Servicios
        const serviciosItem = data.find((item) => item.title.includes('servicios'));
        if (serviciosItem) {
          try { setServicios(JSON.parse(serviciosItem.body_text)); } catch (e) {}
        }
      })
      .catch((err) => console.error('Error cargando contenido:', err));
  }, []);

  // Estilos primarios basados en la marca o defaults corporativos
  const primaryColor = brand?.color_primario || '#2563eb';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Header / Navegación */}
      <header className="border-b border-slate-800 p-6 flex justify-between items-center max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: primaryColor }}>
          {brand?.nombre_marca || 'MYOS Platform'}
        </h1>
        <nav className="space-x-6 text-sm text-slate-400">
          <a href="#inicio" className="hover:text-white transition">Inicio</a>
          <a href="#servicios" className="hover:text-white transition">Servicios</a>
          <a href="#blog" className="hover:text-white transition">Blog</a>
        </nav>
      </header>

      {/* Hero Section (Sección de Inicio) */}
      <section id="inicio" className="py-20 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl sm:text-6xl font-extrabold mb-6 leading-tight">
          {inicio?.titulo || 'Generación Autónoma de Sitios Web con IA'}
        </h2>
        <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
          {inicio?.descripcion || 'Plataforma de alta conversión con gestión de contenidos dinámicos desde Google Drive y flujo estricto de aprobación humana.'}
        </p>
        <button 
          className="px-8 py-3 rounded-lg font-semibold text-white shadow-lg transition"
          style={{ backgroundColor: primaryColor }}
        >
          {inicio?.cta || 'Explorar Plataforma'}
        </button>
      </section>

      {/* Sección de Servicios */}
      <section id="servicios" className="py-16 bg-slate-800/50 border-y border-slate-800 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center">Nuestros Servicios</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {Array.isArray(servicios) && servicios.length > 0 ? (
              servicios.map((srv, idx) => (
                <div key={idx} className="p-6 bg-slate-800 rounded-xl border border-slate-700">
                  <h4 className="text-xl font-semibold mb-2">{srv.titulo}</h4>
                  <p className="text-slate-400 text-sm">{srv.descripcion}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center col-span-3">Cargando servicios dinámicos...</p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-500">
        © 2026 MYOS — Merkatics Growth Operating System
      </footer>
    </div>
  );
}

export default App;