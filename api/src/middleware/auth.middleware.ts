import { createMiddleware } from 'hono/factory';
import { supabaseAdmin } from '../services/supabase.service.js';
import type { User } from '@supabase/supabase-js';

// Define the environment variables schema for Hono context
export type Env = {
  Variables: {
    user: User;
  };
};

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  if (!token) {
    return c.json({ error: 'Unauthorized: Missing token' }, 401);
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }

  c.set('user', user);
  await next();
});
