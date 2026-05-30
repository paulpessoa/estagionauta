import { vi, describe, it, expect, beforeEach } from 'vitest';
import app from '../app.js';
import { supabaseAdmin } from '../services/supabase.service.js';

// Mock env configuration
vi.mock('../config/env.js', () => {
  return {
    env: {
      BREVO_API_KEY: 'mock-brevo-api-key',
      BREVO_SENDER_EMAIL: 'contato@estagionauta.com.br',
      CLIENT_URL: 'http://localhost:5173',
      PORT: '3001',
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://mock.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
      GROQ_API_KEY: 'mock-groq-key',
      STRIPE_SECRET_KEY: 'mock-stripe-key',
      STRIPE_WEBHOOK_SECRET: 'mock-webhook-key',
      STRIPE_PRICE_ASTRONAUTA_ASSINATURA: 'price_1',
      STRIPE_PRICE_COSMONAUTA_ASSINATURA: 'price_2',
      STRIPE_PRICE_ASTRONAUTA_AVULSO: 'price_3',
      STRIPE_PRICE_COSMONAUTA_AVULSO: 'price_4',
      OPENAI_API_KEY: 'mock-openai-key',
    }
  };
});

// Mock Supabase service
vi.mock('../services/supabase.service.js', () => {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  const mockGetUser = vi.fn().mockImplementation((token) => {
    if (token === 'valid-test-token') {
      return { 
        data: { 
          user: { 
            id: 'test-user-uuid', 
            email: 'test@estagionauta.com.br' 
          } 
        }, 
        error: null 
      };
    }
    return { data: { user: null }, error: new Error('Invalid token') };
  });

  return {
    supabaseAdmin: {
      from: mockFrom,
      rpc: mockRpc,
      auth: {
        getUser: mockGetUser
      }
    },
  };
});

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        checkout: {
          sessions: {
            create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/mock-session' }),
          },
        },
      };
    }),
  };
});

// Mock fetch globally for Brevo email sending
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ messageId: 'mock-email-id-123' })
});
global.fetch = mockFetch as any;

describe('Referral & Rewards Router Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Middleware Checks', () => {
    it('returns 401 if missing Authorization header', async () => {
      const res = await app.request('/api/referral/stats', {
        method: 'GET',
      });
      expect(res.status).toBe(401);
      const body = await res.json() as any;
      expect(body.error).toContain('Missing token');
    });

    it('returns 401 if token is invalid', async () => {
      const res = await app.request('/api/referral/stats', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });
      expect(res.status).toBe(401);
      const body = await res.json() as any;
      expect(body.error).toContain('Invalid token');
    });
  });

  describe('GET /api/referral/stats', () => {
    it('returns complete referral statistics and invite list', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { referral_code: 'TESTCODE' },
              error: null
            })
          } as any;
        }
        if (tableName === 'referral_invites') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [
                { name: 'John Doe', email: 'john@doe.com', status: 'pending', created_at: '2026-05-30T00:00:00Z' },
                { name: 'Jane Doe', email: 'jane@doe.com', status: 'active', created_at: '2026-05-29T00:00:00Z' }
              ],
              error: null
            })
          } as any;
        }
        if (tableName === 'credit_transactions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: vi.fn().mockImplementation((resolve) => {
              resolve({
                data: [
                  { amount: 3, description: 'Bônus: Indicação de Jane Doe' }
                ],
                error: null
              });
            })
          } as any;
        }
        return {} as any;
      });

      const res = await app.request('/api/referral/stats', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-test-token',
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.referralCode).toBe('TESTCODE');
      expect(body.totalInvited).toBe(2);
      expect(body.registeredCount).toBe(1);
      expect(body.activeCount).toBe(1);
      expect(body.totalEarnedCredits).toBe(3);
      expect(body.invitees).toHaveLength(2);
    });
  });

  describe('POST /api/referral/invite', () => {
    it('validates input and triggers email invitation', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'referral_invites') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockResolvedValue({ error: null })
          } as any;
        }
        if (tableName === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { full_name: 'Referrer User', email: 'ref@estagionauta.com.br', referral_code: 'REFCODE' },
              error: null
            })
          } as any;
        }
        return {} as any;
      });

      const res = await app.request('/api/referral/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-test-token',
        },
        body: JSON.stringify({
          email: 'friend@test.com',
          name: 'Friend Name'
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.emailSent).toBe(true);
    });

    it('returns 400 validation error if email is invalid', async () => {
      const res = await app.request('/api/referral/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-test-token',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          name: 'Friend Name'
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/rewards/list', () => {
    it('returns available tasks and completion statuses', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { full_name: 'John', bio: 'A student', phone: '123', course: 'CS', university: 'MIT', period: '3-5' },
              error: null
            })
          } as any;
        }
        if (tableName === 'interview_simulations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 1, error: null })
          } as any;
        }
        if (tableName === 'referral_invites') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ count: 0, error: null })
          } as any;
        }
        if (tableName === 'curriculum_analysis') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 0, error: null })
          } as any;
        }
        if (tableName === 'user_tasks') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [
                { task_key: 'complete_profile', completed: true, claimed: true }
              ],
              error: null
            }),
            upsert: vi.fn().mockResolvedValue({ error: null })
          } as any;
        }
        return {} as any;
      });

      const res = await app.request('/api/rewards/list', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-test-token',
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.tasks).toHaveLength(4);
      
      const completeProfileTask = body.tasks.find((t: any) => t.key === 'complete_profile');
      expect(completeProfileTask.completed).toBe(true);
      expect(completeProfileTask.claimed).toBe(true);

      const firstInterviewTask = body.tasks.find((t: any) => t.key === 'first_interview');
      expect(firstInterviewTask.completed).toBe(true);
      expect(firstInterviewTask.claimed).toBe(false);
    });
  });

  describe('POST /api/rewards/claim', () => {
    it('validates claim request and credits task reward', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'user_tasks') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { completed: true, claimed: false },
              error: null
            }),
            upsert: vi.fn().mockResolvedValue({ error: null })
          } as any;
        }
        if (tableName === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { credits: 10 },
              error: null
            })
          } as any;
        }
        return {} as any;
      });

      // Mock RPC call response
      vi.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: true, error: null } as any);

      const res = await app.request('/api/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-test-token',
        },
        body: JSON.stringify({
          taskKey: 'first_interview'
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.reward).toBe(1);
      expect(body.newBalance).toBe(10);
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('add_credits', {
        user_uuid: 'test-user-uuid',
        amount: 1,
        description: 'Recompensa: Concluiu a tarefa "Primeira Entrevista Simulada"'
      });
    });

    it('returns 400 validation error if taskKey is invalid', async () => {
      const res = await app.request('/api/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-test-token',
        },
        body: JSON.stringify({
          taskKey: 'invalid_task_key'
        }),
      });

      expect(res.status).toBe(400);
    });
  });
});
