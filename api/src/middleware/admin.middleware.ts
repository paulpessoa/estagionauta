import { createMiddleware } from 'hono/factory';
import { supabaseAdmin } from '../services/supabase.service.js';
import type { Env } from './auth.middleware.js';

export const adminMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Não autorizado: Usuário não autenticado' }, 401);
  }

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
      return c.json({ error: 'Acesso negado: Apenas administradores ou moderadores' }, 403);
    }

    await next();
  } catch (err) {
    console.error('Error in admin middleware:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});
