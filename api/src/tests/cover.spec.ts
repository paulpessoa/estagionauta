import { vi, describe, it, expect, beforeEach } from 'vitest';
import { checkAbuse } from '../services/abuse.service.js';
import { runCalculateRecess } from '../tools/calculate_recess.js';
import { runCheckCredits } from '../tools/check_credits.js';
import { runUpdateProfile } from '../tools/update_profile.js';
import { runCheckCandidatures } from '../tools/check_candidatures.js';
import { supabaseAdmin } from '../services/supabase.service.js';

// Mock Supabase service
vi.mock('../services/supabase.service.js', () => {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  return {
    supabaseAdmin: {
      from: mockFrom,
      rpc: mockRpc,
    },
  };
});

describe('Cover Tools & Abuse Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('update_profile tool', () => {
    it('updates profile fields successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const updates = {
        course: 'Engenharia de Software',
        university: 'Estácio de Sá',
        period: '3-5',
        invalid_field: 'ignored'
      };

      const result = await runUpdateProfile('user-id-123', updates);

      expect(result.success).toBe(true);
      expect(result.updatedFields).toContain('course');
      expect(result.updatedFields).toContain('university');
      expect(result.updatedFields).toContain('period');
      expect(result.updatedFields).not.toContain('invalid_field');
      
      expect(supabaseAdmin.from).toHaveBeenCalledWith('user_profiles');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-id-123');
      expect(mockUpdate).toHaveBeenCalledWith({
        course: 'Engenharia de Software',
        university: 'Estácio de Sá',
        period: '3-5'
      });
    });

    it('returns error if no valid fields provided', async () => {
      const result = await runUpdateProfile('user-id-123', { foo: 'bar' });
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Nenhum campo válido');
    });
  });

  describe('check_candidatures tool', () => {
    it('queries and returns candidatures successfully', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          { company: 'Google', position: 'Software Engineer Intern', status: 'interview', progress: 50, next_action: 'RH Call', next_action_date: '2026-06-01', applied_date: '2026-05-20' }
        ],
        error: null
      });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await runCheckCandidatures('user-id-123');

      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
      expect(result.candidaturas![0].empresa).toBe('Google');
      expect(result.candidaturas![0].cargo).toBe('Software Engineer Intern');
      expect(result.candidaturas![0].status).toBe('Entrevista');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('kanban_applications');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-id-123');
    });
  });

  describe('calculate_recess tool', () => {
    it('calculates recess days and value correctly', async () => {
      const result = await runCalculateRecess({
        startDate: '2025-01-01',
        endDate: '2025-07-01', // Exactly 6 months
        salario: 1200.0,
      });

      expect(result.success).toBe(true);
      expect(result.monthsWorked).toBe(6);
      expect(result.diasRecesso).toBe(15);
      expect(result.valorRecesso).toBe(600.0);
    });

    it('returns error for invalid date', async () => {
      const result = await runCalculateRecess({
        startDate: 'invalid-date',
        salario: 1000,
      });
      expect(result.error).toBeDefined();
    });
  });

  describe('check_credits tool', () => {
    it('queries and returns credits successfully', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { credits: 10, subscription_status: 'premium' },
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await runCheckCredits('user-id-123');

      expect(result.success).toBe(true);
      expect(result.credits).toBe(10);
      expect(result.subscription_status).toBe('premium');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('user_profiles');
    });
  });

  describe('abuse service', () => {
    it('allows requests when user is within limits', async () => {
      // 1. Cooldown query: returns no cooldown entries
      const mockLimitCooldown = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrderCooldown = vi.fn().mockReturnValue({ limit: mockLimitCooldown });
      const mockGteCooldown = vi.fn().mockReturnValue({ order: mockOrderCooldown });
      const mockEq2Cooldown = vi.fn().mockReturnValue({ gte: mockGteCooldown });
      const mockEq1Cooldown = vi.fn().mockReturnValue({ eq: mockEq2Cooldown });
      
      // 2. Count messages queries
      const mockCount = vi.fn().mockResolvedValue({ count: 5, error: null });
      
      // Setup mock implementation based on table name
      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'cover_abuse_logs') {
          return { select: vi.fn().mockReturnValue({ eq: mockEq1Cooldown }) } as any;
        }
        if (tableName === 'cover_messages') {
          return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ gte: mockCount }) }) }) } as any;
        }
        return {} as any;
      });

      const result = await checkAbuse('user-123', '127.0.0.1');
      expect(result.allowed).toBe(true);
    });

    it('blocks request when user hourly limit is exceeded', async () => {
      const mockLimitCooldown = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrderCooldown = vi.fn().mockReturnValue({ limit: mockLimitCooldown });
      const mockGteCooldown = vi.fn().mockReturnValue({ order: mockOrderCooldown });
      const mockEq2Cooldown = vi.fn().mockReturnValue({ gte: mockGteCooldown });
      const mockEq1Cooldown = vi.fn().mockReturnValue({ eq: mockEq2Cooldown });
      
      // 5min count = 2, 1hour count = 35 (exceeds hourly limit of 30)
      const mockCount = vi.fn()
          .mockResolvedValueOnce({ count: 2, error: null }) // 5 min count check
          .mockResolvedValueOnce({ count: 35, error: null }); // 1 hour count check

      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'cover_abuse_logs') {
          return {
            select: vi.fn().mockReturnValue({ eq: mockEq1Cooldown }),
            insert: mockInsert,
          } as any;
        }
        if (tableName === 'cover_messages') {
          return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ gte: mockCount }) }) }) } as any;
        }
        return {} as any;
      });

      const result = await checkAbuse('user-123', '127.0.0.1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('rate_limit_hourly');
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});
