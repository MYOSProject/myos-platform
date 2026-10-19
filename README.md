# MYOS · My Online System

Asistente de contenido con IA: conoce tu negocio (chat + perfil), crea sitio web y publicaciones (Facebook, Instagram, LinkedIn)
y **nada se publica sin aprobación humana registrada** (quién, cuándo, huella SHA-256).

1. `npm install`
2. Copia `.env.example` a `.env`: `GEMINI_API_KEY` y `APPROVER_EMAILS`.
3. `npm run dev` → http://localhost:3000
4. `npm test`

Publicación real en redes: configura `MAKE_WEBHOOK_URL` (Make/Zapier) o las llaves `META_*`. Sin eso todo queda en simulación.
Vercel: `npm run build` genera `api/index.js` (el servidor empaquetado); súbelo al repositorio junto con el resto.
Diseño: Manual de Identidad MYOS v1.0 (azul marino #111827, coral #E2554F, turquesa #8CCFD9; Plus Jakarta Sans + Inter).
