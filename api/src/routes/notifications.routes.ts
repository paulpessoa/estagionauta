import { Hono } from 'hono';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';

const app = new Hono<Env>();

// GET /api/notifications - List user notifications
app.get('/', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return c.json({ error: 'Erro ao buscar notificações' }, 500);
    }

    return c.json(notifications ?? []);
  } catch (err) {
    console.error('Notifications fetch error:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// PUT /api/notifications/read-all - Mark all as read (Place before /:id/read to prevent route shadowing)
app.put('/read-all', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Error reading all notifications:', error);
      return c.json({ error: 'Erro ao marcar todas como lidas' }, 500);
    }

    return c.json({ success: true, count: data?.length ?? 0 });
  } catch (err) {
    console.error('Notifications read all error:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
app.put('/:id/read', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Error updating notification:', error);
      return c.json({ error: 'Erro ao ler notificação' }, 500);
    }

    return c.json(data?.[0] || { success: true });
  } catch (err) {
    console.error('Notification update error:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// DELETE /api/notifications/:id - Delete notification
app.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting notification:', error);
      return c.json({ error: 'Erro ao excluir notificação' }, 500);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Notification delete error:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

export default app;
