import { Hono } from 'hono';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';

const app = new Hono<Env>();

// DELETE /api/user/delete-account - Excluir própria conta
app.delete('/delete-account', authMiddleware, async (c) => {
  const user = c.get('user');
  console.log(`Solicitação de exclusão de conta recebida para o usuário: ${user.id}`);
  
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('Erro ao excluir usuário no Supabase Auth:', error);
      return c.json({ error: 'Erro ao excluir conta de usuário' }, 500);
    }
    
    console.log(`Usuário ${user.id} excluído com sucesso.`);
    return c.json({ success: true, message: 'Conta excluída com sucesso' });
  } catch (err) {
    console.error('Erro no endpoint de exclusão de conta:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

export default app;
