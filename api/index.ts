// Explicit Vercel entrypoint for the existing Express application.
// Importing server.ts does not start a listener when running on Vercel.
import app from '../server.ts';

export default app;
