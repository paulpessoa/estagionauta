import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import stripeRoutes from './routes/stripe.routes.js';
import creditsRoutes from './routes/credits.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import emailRoutes from './routes/email.routes.js';
import kanbanRoutes from './routes/kanban.routes.js';
import generatorRoutes from './routes/generator.routes.js';
import simulatorRoutes from './routes/simulator.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';
import copilotRoutes from './routes/copilot.routes.js';

const app = new Hono();

app.use('*', logger());


// Configure CORS
app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      const allowedOrigins = ['https://estagionauta.com.br', 'https://www.estagionauta.com.br', 'http://localhost:5173', 'http://localhost:8080'];
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
app.route('/api/generator', generatorRoutes);
app.route('/api/simulator', simulatorRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/user', userRoutes);
app.route('/api/copilot', copilotRoutes);

export default app;

