import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { runListAvailableTasks } from '../tools/list_available_tasks.js';
import { runClaimTaskReward } from '../tools/claim_task_reward.js';

const app = new Hono<Env>();

const claimRewardSchema = z.object({
  taskKey: z.enum(['complete_profile', 'first_interview', 'invite_friend', 'first_analysis']),
});

// GET /api/rewards/list - List all available gamified tasks and their completion/claim statuses
app.get('/list', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const result = await runListAvailableTasks(user.id);
    
    if ('error' in result) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result);
  } catch (err: any) {
    console.error('Rewards list route error:', err);
    return c.json({ error: 'Erro interno ao listar tarefas' }, 500);
  }
});

// POST /api/rewards/claim - Claim credits reward for a completed task
app.post('/claim', authMiddleware, zValidator('json', claimRewardSchema), async (c) => {
  const user = c.get('user');
  const { taskKey } = c.req.valid('json');

  try {
    const result = await runClaimTaskReward(user.id, { taskKey });

    if ('error' in result) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result);
  } catch (err: any) {
    console.error('Rewards claim route error:', err);
    return c.json({ error: 'Erro interno ao processar resgate de recompensa' }, 500);
  }
});

export default app;
