import { vi, describe, it, expect, beforeEach } from 'vitest';
import { runBuyCredits } from '../tools/buy_credits.js';
import { runStartInterview } from '../tools/start_interview.js';
import { runGenerateResume } from '../tools/generate_resume.js';
import { runAnalyzeCandidatura } from '../tools/analyze_candidatura.js';
import { runUpdateCandidatura } from '../tools/update_candidatura.js';
import { runGetReferralLink } from '../tools/get_referral_link.js';
import { runInviteFriend } from '../tools/invite_friend.js';
import { runListInvitees } from '../tools/list_invitees.js';
import { runCheckReferralStats } from '../tools/check_referral_stats.js';
import { runListAvailableTasks } from '../tools/list_available_tasks.js';
import { runClaimTaskReward } from '../tools/claim_task_reward.js';
import { runRequestPasswordReset } from '../tools/request_password_reset.js';
import { supabaseAdmin } from '../services/supabase.service.js';

// Mock Supabase
vi.mock('../services/supabase.service.js', () => {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  const mockResetPassword = vi.fn().mockResolvedValue({ error: null });
  return {
    supabaseAdmin: {
      from: mockFrom,
      rpc: mockRpc,
      auth: {
        resetPasswordForEmail: mockResetPassword
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

// Mock OpenAI service helper functions
vi.mock('../services/openai.service.js', () => {
  return {
    generateNextInterviewQuestionAI: vi.fn().mockResolvedValue('Mocked first interview question?'),
    generateResumeAI: vi.fn().mockResolvedValue('# Mocked Resume\nContent here.'),
  };
});

// Mock global fetch for Brevo email sending
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ messageId: 'mock-email-id-123' })
});
global.fetch = mockFetch as any;

describe('Sprint 1 Rover Tools Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buy_credits tool', () => {
    it('creates checkout session successfully', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { email: 'test@example.com' },
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await runBuyCredits('user-123', { planId: 'cosmonauta' });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://checkout.stripe.com/mock-session');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('user_profiles');
    });
  });

  describe('start_interview tool', () => {
    it('consumes credit and returns simulation url', async () => {
      vi.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: true, error: null });

      const mockSingleProfile = vi.fn().mockResolvedValue({ data: { full_name: 'John Doe' }, error: null });
      const mockEqProfile = vi.fn().mockReturnValue({ single: mockSingleProfile });
      const mockSelectProfile = vi.fn().mockReturnValue({ eq: mockEqProfile });

      const mockSingleInsert = vi.fn().mockResolvedValue({ data: { id: 'sim-123' }, error: null });
      const mockSelectInsert = vi.fn().mockReturnValue({ single: mockSingleInsert });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelectInsert });

      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'user_profiles') {
          return { select: mockSelectProfile } as any;
        }
        if (tableName === 'interview_simulations') {
          return { insert: mockInsert } as any;
        }
        return {} as any;
      });

      const result = await runStartInterview('user-123', { jobTitle: 'QA Intern' });

      expect(result.success).toBe(true);
      expect(result.simulationId).toBe('sim-123');
      expect(result.url).toContain('/simulador-entrevistas?id=sim-123');
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('consume_credits', expect.any(Object));
    });
  });

  describe('generate_resume tool', () => {
    it('consumes credit and returns generated resume', async () => {
      const mockSingleProfile = vi.fn().mockResolvedValue({ 
        data: { credits: 5, email: 'test@test.com', full_name: 'Jane Doe', course: 'Computing' }, 
        error: null 
      });
      const mockEqProfile = vi.fn().mockReturnValue({ single: mockSingleProfile });
      const mockSelectProfile = vi.fn().mockReturnValue({ eq: mockEqProfile });

      const mockLimitResume = vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) });
      const mockOrderResume = vi.fn().mockReturnValue({ limit: mockLimitResume });
      const mockEqResume = vi.fn().mockReturnValue({ order: mockOrderResume });
      const mockSelectResume = vi.fn().mockReturnValue({ eq: mockEqResume });

      const mockSingleSave = vi.fn().mockResolvedValue({ data: { id: 'resume-123' }, error: null });
      const mockSelectSave = vi.fn().mockReturnValue({ single: mockSingleSave });
      const mockInsertSave = vi.fn().mockReturnValue({ select: mockSelectSave });

      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'user_profiles') {
          return { select: mockSelectProfile } as any;
        }
        if (tableName === 'generated_resumes') {
          return { 
            select: mockSelectResume,
            insert: mockInsertSave
          } as any;
        }
        return {} as any;
      });

      vi.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: true, error: null });

      const result = await runGenerateResume('user-123', { jobTitle: 'Backend Dev' });

      expect(result.success).toBe(true);
      expect(result.resumeId).toBe('resume-123');
      expect(result.content).toBe('# Mocked Resume\nContent here.');
    });
  });

  describe('update_candidatura tool', () => {
    it('updates status and recalculates progress', async () => {
      const mockSingleApp = vi.fn().mockResolvedValue({ 
        data: { id: 'app-123', company: 'Google', position: 'SWE', status: 'interested' }, 
        error: null 
      });
      const mockEqApp2 = vi.fn().mockReturnValue({ single: mockSingleApp });
      const mockEqApp = vi.fn().mockReturnValue({ eq: mockEqApp2 });
      const mockSelectApp = vi.fn().mockReturnValue({ eq: mockEqApp });

      const mockSingleUpdate = vi.fn().mockResolvedValue({ 
        data: { id: 'app-123', company: 'Google', position: 'SWE', status: 'interview', progress: 40 }, 
        error: null 
      });
      const mockSelectUpdate = vi.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'kanban_applications') {
          return { 
            select: mockSelectApp,
            update: mockUpdate
          } as any;
        }
        return {} as any;
      });

      const result = await runUpdateCandidatura('user-123', { 
        candidatureId: 'app-123',
        status: 'interview'
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('interview');
      expect(result.progress).toBe(40);
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'interview', progress: 40 });
    });
  });

  describe('get_referral_link tool', () => {
    it('returns link with referral code', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { referral_code: 'MYCODE12' }, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabaseAdmin.from).mockReturnValue({ select: mockSelect } as any);

      const result = await runGetReferralLink('user-123');

      expect(result.success).toBe(true);
      expect(result.referralCode).toBe('MYCODE12');
      expect(result.url).toContain('/r/MYCODE12');
    });
  });

  describe('invite_friend tool', () => {
    it('sends email and logs invite', async () => {
      const mockMaybeSingleInvite = vi.fn().mockResolvedValue({ data: null });
      const mockEqInvite2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingleInvite });
      const mockEqInvite = vi.fn().mockReturnValue({ eq: mockEqInvite2 });
      const mockSelectInvite = vi.fn().mockReturnValue({ eq: mockEqInvite });

      const mockSingleProfile = vi.fn().mockResolvedValue({ data: { full_name: 'John', email: 'john@test.com', referral_code: 'CODE' }, error: null });
      const mockEqProfile = vi.fn().mockReturnValue({ single: mockSingleProfile });
      const mockSelectProfile = vi.fn().mockReturnValue({ eq: mockEqProfile });

      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'referral_invites') {
          return { 
            select: mockSelectInvite,
            insert: mockInsert
          } as any;
        }
        if (tableName === 'user_profiles') {
          return { select: mockSelectProfile } as any;
        }
        return {} as any;
      });

      const result = await runInviteFriend('user-123', { name: 'Bob', email: 'bob@test.com' });

      expect(result.success).toBe(true);
      expect(result.email).toBe('bob@test.com');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('referral_invites');
    });
  });

  describe('list_invitees tool', () => {
    it('returns invited friends', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [{ name: 'Bob', email: 'bob@test.com', status: 'pending', created_at: '2026-05-29' }],
        error: null
      });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabaseAdmin.from).mockReturnValue({ select: mockSelect } as any);

      const result = await runListInvitees('user-123');

      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
      expect(result.invitees[0].name).toBe('Bob');
    });
  });

  describe('check_referral_stats tool', () => {
    it('returns counts and earned credits', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'referral_invites') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ status: 'registered' }, { status: 'active' }],
                error: null
              })
            })
          } as any;
        }
        if (tableName === 'credit_transactions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ amount: 3, description: 'Indicação de amigo' }],
                  error: null
                })
              })
            })
          } as any;
        }
        return {} as any;
      });

      const result = await runCheckReferralStats('user-123');

      expect(result.success).toBe(true);
      expect(result.totalInvited).toBe(2);
      expect(result.registeredCount).toBe(2);
      expect(result.totalEarnedCredits).toBe(3);
    });
  });

  describe('request_password_reset tool', () => {
    it('calls resetPasswordForEmail successfully', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { email: 'john@test.com' }, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabaseAdmin.from).mockReturnValue({ select: mockSelect } as any);

      const result = await runRequestPasswordReset('user-123');

      expect(result.success).toBe(true);
      expect(supabaseAdmin.auth.resetPasswordForEmail).toHaveBeenCalledWith('john@test.com', expect.any(Object));
    });
  });

  describe('analyze_candidatura tool', () => {
    it('consumes credits and performs analysis', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'user_profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { credits: 5, full_name: 'John', course: 'Computing' },
                  error: null
                })
              })
            })
          } as any;
        }
        if (tableName === 'kanban_applications') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({
                    data: { company: 'Google', position: 'SWE', description: 'React Dev' },
                    error: null
                  })
                })
              })
            })
          } as any;
        }
        if (tableName === 'generated_resumes') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: () => Promise.resolve({ data: null, error: null })
                  })
                })
              })
            })
          } as any;
        }
        return {} as any;
      });

      vi.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: true, error: null });

      // Mock OpenAI completions.create
      vi.mock('openai', () => {
        return {
          default: vi.fn().mockImplementation(() => {
            return {
              chat: {
                completions: {
                  create: vi.fn().mockResolvedValue({
                    choices: [
                      {
                        message: {
                          content: JSON.stringify({
                            compatibilityScore: 90,
                            summary: 'Perfil compatível',
                            strengths: ['Forte base'],
                            gaps: ['Nenhum'],
                            interviewTips: ['Seja profissional']
                          })
                        }
                      }
                    ]
                  })
                }
              }
            };
          })
        };
      });

      const { runAnalyzeCandidatura } = await import('../tools/analyze_candidatura.js');
      const result = await runAnalyzeCandidatura('user-123', { candidatureId: 'app-123' });

      expect(result.success).toBe(true);
      expect(result.analysis.compatibilityScore).toBe(90);
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('consume_credits', {
        user_uuid: 'user-123',
        amount: 2,
        description: 'Análise de compatibilidade: SWE na Google'
      });
    });
  });

  describe('list_available_tasks tool', () => {
    it('returns available tasks and checks completion status', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'user_profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { full_name: 'John', bio: 'Bio', phone: '123', course: 'IT', university: 'Uni', period: '3' },
                  error: null
                })
              })
            })
          } as any;
        }
        if (tableName === 'interview_simulations') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ count: 1, error: null })
            })
          } as any;
        }
        if (tableName === 'referral_invites') {
          return {
            select: () => ({
              eq: () => ({
                in: () => Promise.resolve({ count: 1, error: null })
              })
            })
          } as any;
        }
        if (tableName === 'curriculum_analysis') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ count: 1, error: null })
            })
          } as any;
        }
        if (tableName === 'user_tasks') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null })
            }),
            upsert: () => Promise.resolve({ error: null })
          } as any;
        }
        return {} as any;
      });

      const result = await runListAvailableTasks('user-123');

      expect(result.success).toBe(true);
      expect(result.tasks.length).toBe(4);
      expect(result.tasks[0].completed).toBe(true);
    });
  });

  describe('claim_task_reward tool', () => {
    it('claims reward if completed and not claimed', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'user_tasks') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: { completed: true, claimed: false }, error: null })
                })
              })
            }),
            upsert: mockUpsert
          } as any;
        }
        if (tableName === 'user_profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { credits: 10 }, error: null })
              })
            })
          } as any;
        }
        return {} as any;
      });

      vi.mocked(supabaseAdmin.rpc).mockResolvedValue({ data: true, error: null });

      const result = await runClaimTaskReward('user-123', { taskKey: 'complete_profile' });

      expect(result.success).toBe(true);
      expect(result.reward).toBe(2);
      expect(result.newBalance).toBe(10);
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('add_credits', {
        user_uuid: 'user-123',
        amount: 2,
        description: 'Recompensa: Concluiu a tarefa "Completar Perfil"'
      });
    });
  });
});

