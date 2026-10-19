# MYOS · Merkatics GrowthLab (2026-544-11)

1. `npm install`
2. Copia `.env.example` a `.env` y pon `GEMINI_API_KEY` (también se lee `.env.local` y `frontend/.env`). Pon `APPROVER_EMAILS`.
3. `npm run dev` → http://localhost:3000. Usa "Probar conexión con Gemini" en *Estado y auditoría*.
4. `npm test` (pruebas con Gemini/webhook/Graph simulados).

Regla central: nada se publica sin aprobación humana registrada (quién, cuándo, huella SHA-256). Editar algo aprobado borra la aprobación.
Publicación en redes: modo simulación hasta configurar `MAKE_WEBHOOK_URL` (o llaves META_*).
Producción: AUTH_MODE=dev se ignora; en Vercel el archivo de datos es temporal, se requiere una base de datos real.
