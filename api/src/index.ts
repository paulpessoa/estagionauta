import { serve } from '@hono/node-server';
import app from './app.js';
import { env } from './config/env.js';

console.log(`🚀 Server starting on port ${env.PORT}...`);
console.log(`🌍 Environment: ${env.NODE_ENV}`);

serve({
  fetch: app.fetch,
  port: env.PORT,
});
