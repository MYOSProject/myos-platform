import { useEffect, useState } from 'react';

function App() {
  const [contents, setContents] = useState([]);

  useEffect(() => {
    // Reemplaza por la URL real de tu backend en Render
    fetch('https://myos-platform.onrender.com/api/content/')
      .then((res) => res.json())
      .then((data) => setContents(data))
      .catch((err) => console.error('Error cargando contenido:', err));
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Sitio Piloto MYOS</h1>
      
      {contents.length === 0 ? (
        <p>No hay contenido publicado disponible.</p>
      ) : (
        contents.map((item) => (
          <article key={item.id} className="border p-4 my-2 rounded shadow">
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="text-gray-600">{item.body_text}</p>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Estado: {item.status}
            </span>
          </article>
        ))
      )}
    </div>
  );
}

export default App;