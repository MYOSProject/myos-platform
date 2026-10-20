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


## Novedades (proyectos, conexiones, persistencia)

- **Mis proyectos**: cada usuario crea varios proyectos; todo (recorrido, chat, publicaciones) queda separado por proyecto.
- **Lo escrito se guarda**: el recorrido «Empezar» se autoguarda y «Crear contenido» recuerda su avance; las pantallas no pierden el estado al cambiar de página.
- **Contenido con IA**: una sola pantalla. La IA decide temas, textos, imágenes y fechas con la información del proyecto («Generar contenido con IA»), puede renovarlo («Actualizar con IA») y hasta armar el sitio. La persona solo revisa, aprueba y publica.
- **Conexiones**: por proyecto, Facebook/Instagram (token cifrado, «Probar conexión», «Activar publicación real») o webhook de Make/Zapier. Sin activar = simulación.
- **Aprobación abierta**: cualquier usuario con sesión puede aprobar y publicar; siempre se registra quién. Restringir con `RESTRICT_APPROVERS=true` + `APPROVER_EMAILS`.
- **Vercel**: define `FIREBASE_SERVICE_ACCOUNT`, `CONNECTIONS_KEY` (y `GEMINI_API_KEY`), activa Firestore y redeploy.
