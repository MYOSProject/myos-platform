import { useEffect, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function App() {
  const [sections, setSections] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL dinámica que tomará Vercel (.env) o la local por defecto
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contentRes = await axios.get(`${API_URL}/api/content/`);
        setSections(contentRes.data);

        try {
          const postsRes = await axios.get(`${API_URL}/api/social-posts/`);
          setPosts(postsRes.data);
        } catch (err) {
          console.log('Sección de redes sociales aún sin posts aprobados:', err);
        }
      } catch (error) {
        console.error('Error cargando el contenido:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0F172A', color: '#fff', fontFamily: 'system-ui' }}>
        Cargando sitio MYOS...
      </div>
    );
  }

  // Extract Brand Settings (MARCA) to use as global CSS variables
  const marcaSec = sections.find((s) => s.section_key === 'MARCA')?.content_payload || {};
  const colores = marcaSec.colores || { 
    primario: '#1E293B', 
    secundario: '#E11D48', 
    fondo: '#F8FAFC', 
    texto: '#0F172A' 
  };

  // Content Sections
  const inicioContent = sections.find((s) => s.section_key === 'INICIO')?.content_payload || {};
  const serviciosContent = sections.find((s) => s.section_key === 'SERVICIOS')?.content_payload || {};
  const blogContent = sections.find((s) => s.section_key === 'BLOG')?.content_payload || null;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colores.fondo || '#F8FAFC',
      color: colores.texto || '#0F172A',
      fontFamily: marcaSec.tipografia || 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 1. HEADER / NAVBAR */}
      <header style={{
        backgroundColor: colores.primario,
        color: '#ffffff',
        padding: '1.2rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: '#ffffff' }}>
            {marcaSec.nombre_marca || 'MYOS'}
          </h1>
          {marcaSec.eslogan && (
            <span style={{ fontSize: '0.85rem', opacity: 0.9, fontStyle: 'italic', color: colores.secundario }}>
              {marcaSec.eslogan}
            </span>
          )}
        </div>
        <nav style={{ display: 'flex', gap: '1.5rem', fontWeight: '600' }}>
          <a href="#inicio" style={{ color: '#ffffff', textDecoration: 'none' }}>Inicio</a>
          <a href="#servicios" style={{ color: '#ffffff', textDecoration: 'none' }}>Servicios</a>
          {blogContent && <a href="#blog" style={{ color: '#ffffff', textDecoration: 'none' }}>Blog</a>}
          {posts.length > 0 && <a href="#redes" style={{ color: '#ffffff', textDecoration: 'none' }}>Redes</a>}
        </nav>
      </header>

      {/* 2. HERO SECTION (INICIO) */}
      {inicioContent.hero && (
        <section id="inicio" style={{
          padding: '5rem 2rem',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderBottom: `1px solid ${colores.secundario}`
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.8rem', marginBottom: '1rem', color: colores.primario }}>
              {inicioContent.hero.titulo}
            </h2>
            <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: colores.texto, opacity: 0.9 }}>
              {inicioContent.hero.subtitulo}
            </p>
            {inicioContent.hero.cta_texto && (
              <button style={{
                padding: '12px 28px',
                backgroundColor: colores.secundario || colores.primario,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {inicioContent.hero.cta_texto}
              </button>
            )}
          </div>
        </section>
      )}

      {/* 3. SERVICIOS / PRODUCTOS SECTION */}
      {serviciosContent.items && (
        <section id="servicios" style={{ padding: '4rem 2rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '2.5rem', color: colores.primario }}>
            {serviciosContent.titulo_seccion || 'Nuestros Servicios'}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {serviciosContent.items.map((item, idx) => (
              <div key={idx} style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: `1px solid rgba(0,0,0,0.05)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: colores.primario }}>{item.nombre}</h3>
                    <span style={{ fontWeight: 'bold', color: colores.secundario, backgroundColor: colores.fondo, padding: '2px 8px', borderRadius: '6px' }}>
                      {item.precio}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#555', lineHeight: '1.4' }}>
                    {item.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. BLOG SECTION (MARKDOWN) */}
      {blogContent && (
        <section id="blog" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '2rem', color: colores.primario }}>
            {blogContent.titulo || 'Blog & Novedades'}
          </h2>
          <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', lineHeight: '1.7' }}>
            <ReactMarkdown>{blogContent.cuerpo_markdown}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* 5. REDES SOCIALES SECTION (PROPUESTAS APROBADAS) */}
      {posts.length > 0 && (
        <section id="redes" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '2rem', color: colores.primario }}>
            📢 Campañas de Redes Sociales (Aprobadas)
          </h2>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {posts.map((post) => (
              <div key={post.id} style={{ 
                backgroundColor: '#ffffff', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                borderLeft: `5px solid ${colores.secundario}`, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
              }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: colores.primario, textTransform: 'uppercase' }}>
                  Plataforma: {post.platform}
                </span>
                <p style={{ margin: '0.8rem 0', color: '#333', fontSize: '1rem', lineHeight: '1.5' }}>
                  {post.copy_text}
                </p>
                <small style={{ color: '#666', fontStyle: 'italic' }}>
                  Aprobado por: {post.approved_by_username || 'Administrador'}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. FOOTER */}
      <footer style={{
        marginTop: 'auto',
        backgroundColor: colores.primario,
        color: '#ffffff',
        textAlign: 'center',
        padding: '2rem',
        fontSize: '0.9rem'
      }}>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} {marcaSec.nombre_marca || 'MYOS'}. Generado mediante Cerebro Digital.
        </p>
      </footer>
    </div>
  );
}

export default App;