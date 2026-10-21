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

## Google Drive y publicación programada

- **Drive**: en «Conexiones» se pega el enlace de una carpeta compartida con la cuenta de servicio (Editor). MYOS crea `Marca`, `Sitio_Web`, `Redes_Sociales` (`Para_Publicar`, `Publicado`) y `Calendario`, cada una con `Procesados`. «Sincronizar ahora» lee los documentos de texto (Google Docs, Hojas como CSV, .txt, .md, .json), los usa como contexto de la IA (siempre como dato, nunca como instrucciones) y los mueve a `Procesados`. Imágenes y PDFs no se leen ni se mueven. Al publicar, se intenta guardar la evidencia en `Redes_Sociales/Publicado` (si Drive no deja escribir en Mi unidad por la cuota de la cuenta de servicio, solo se registra en el log; con una unidad compartida funciona).
- **Programar**: «Aprobar y programar» deja la publicación aprobada (a nombre de la persona) y el programador la publica cuando llega su fecha. Editarla después cancela la aprobación y la programación. Requiere `CRON_SECRET`; `vercel.json` trae un cron diario (`0 18 * * *`, 12:00 en Ciudad Juárez). En un plan Pro puede cambiarse a cada hora o cada minuto. En «Calendario» hay un botón para adelantar la revisión.

- **Cuenta de servicio de Drive**: por defecto se usa `FIREBASE_SERVICE_ACCOUNT`. Si la API de Drive está activada en otro proyecto de Google Cloud, pega el JSON de esa cuenta en `DRIVE_SERVICE_ACCOUNT` (tiene prioridad solo para Drive) y comparte la carpeta con su `client_email`.
