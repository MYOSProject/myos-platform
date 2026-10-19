// Punto de entrada para Vercel. Se empaqueta con esbuild en api/index.js (npm run build:api).
import { createApp } from './app.js';
import { errorHandler } from './http.js';

const app = createApp();
app.use(errorHandler);
export default app;
