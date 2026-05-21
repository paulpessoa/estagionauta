import { Hono } from 'hono';
import { cors } from 'hono/cors';
import stripeRoutes from './routes/stripe.routes.js';
import creditsRoutes from './routes/credits.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import emailRoutes from './routes/email.routes.js';
import kanbanRoutes from './routes/kanban.routes.js';

const app = new Hono();

// Configure CORS
app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      const allowedOrigins = ['https://estagionauta.com.br', 'http://localhost:5173'];
      return allowedOrigins.includes(origin) ? origin : 'https://estagionauta.com.br';
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register routes
app.route('/api/stripe', stripeRoutes);
app.route('/api/credits', creditsRoutes);
app.route('/api/analysis', analysisRoutes);
app.route('/api/email', emailRoutes);
app.route('/api/kanban', kanbanRoutes);

export default app;
