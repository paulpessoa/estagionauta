import { vi, describe, it, expect, beforeEach } from 'vitest';
import { runSearchAgencies } from '../tools/search_agencies.js';
import { runGetAgencyDetails } from '../tools/get_agency_details.js';
import { runSubmitAgencyReview } from '../tools/submit_agency_review.js';
import { runCreateAgency } from '../tools/create_agency.js';
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

describe('Rover Agency Tools Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search_agencies tool', () => {
    it('returns filtered approved agencies successfully', async () => {
      const mockAgencies = [
        { id: '1', name: 'CIEE Pernambuco', description: 'Agência de estágios PE', city: 'Recife', state: 'PE', agency_type: 'faculdade' },
        { id: '2', name: 'Nube', description: 'Nacional de estágios', city: 'São Paulo', state: 'SP', agency_type: 'agencia_privada' },
      ];

      const mockQueryBuilder = {
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((onfulfilled) => {
          return Promise.resolve(onfulfilled({ data: mockAgencies, error: null }));
        }),
      };

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQueryBuilder as any);

      // Search with PE state filter and query "ciee"
      const result = await runSearchAgencies('user-123', { state: 'PE', query: 'ciee' });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.agencies![0].name).toBe('CIEE Pernambuco');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('agencies');
    });
  });

  describe('get_agency_details tool', () => {
    it('fetches agency details and approved reviews successfully', async () => {
      const mockAgency = { id: 'agency-123', name: 'CIEE', status: 'approved' };
      const mockReviews = [
        { id: 'review-1', rating: 5, comment: 'Excelente agência!', created_at: '2026-06-01' }
      ];

      const mockSingle = vi.fn().mockResolvedValue({ data: mockAgency, error: null });
      const mockEqAgency = vi.fn().mockReturnValue({ single: mockSingle });

      const mockOrder = vi.fn().mockResolvedValue({ data: mockReviews, error: null });
      const mockEqReviewsStatus = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEqReviewsId = vi.fn().mockReturnValue({ eq: mockEqReviewsStatus });

      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'agencies') {
          return { select: vi.fn().mockReturnValue({ eq: mockEqAgency }) } as any;
        }
        if (tableName === 'agency_reviews') {
          return { select: vi.fn().mockReturnValue({ eq: mockEqReviewsId }) } as any;
        }
        return {} as any;
      });

      const result = await runGetAgencyDetails('user-123', { agencyId: 'agency-123' });

      expect(result.success).toBe(true);
      expect(result.agency.name).toBe('CIEE');
      expect(result.reviews!.length).toBe(1);
      expect(result.reviews![0].comment).toBe('Excelente agência!');
    });
  });

  describe('submit_agency_review tool', () => {
    it('returns error if comment is too short', async () => {
      const result = await runSubmitAgencyReview('user-123', {
        agencyId: 'agency-123',
        rating: 5,
        comment: 'Muito curto', // < 20 characters
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('mínimo 20 caracteres');
    });

    it('returns error if user already reviewed this agency', async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: [{ id: 'review-existing' }], error: null });
      const mockEqUser = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEqAgency = vi.fn().mockReturnValue({ eq: mockEqUser });

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: mockEqAgency }),
      } as any);

      const result = await runSubmitAgencyReview('user-123', {
        agencyId: 'agency-123',
        rating: 4,
        comment: 'Este comentário é longo o suficiente para passar no teste de tamanho.',
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('já enviou uma avaliação');
    });

    it('submits review successfully if valid', async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockEqUser = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEqAgency = vi.fn().mockReturnValue({ eq: mockEqUser });

      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabaseAdmin.from).mockImplementation((tableName: string) => {
        if (tableName === 'agency_reviews') {
          return {
            select: vi.fn().mockReturnValue({ eq: mockEqAgency }),
            insert: mockInsert,
          } as any;
        }
        return {} as any;
      });

      const result = await runSubmitAgencyReview('user-123', {
        agencyId: 'agency-123',
        rating: 5,
        comment: 'Comentário excelente de pelo menos vinte caracteres obrigatórios.',
      });

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('create_agency tool', () => {
    it('returns error if state format is invalid', async () => {
      const result = await runCreateAgency('user-123', {
        name: 'Agencia Inválida',
        description: 'Testando estado inválido',
        email: 'test@agency.com',
        phone: '12345',
        address: 'Rua Principal',
        city: 'Recife',
        state: 'PEE', // More than 2 chars
        agencyType: 'outro',
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('sigla de 2 caracteres');
    });

    it('registers pending agency successfully', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'new-agency-uuid', name: 'Agencia CIEE PE' }, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      vi.mocked(supabaseAdmin.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await runCreateAgency('user-123', {
        name: 'Agencia CIEE PE',
        description: 'Descrição longa sobre estagio',
        email: 'ciee@ciee.com',
        phone: '8133333333',
        address: 'Rua Principal, 123',
        city: 'Recife',
        state: 'pe',
        agencyType: 'consultoria',
      });

      expect(result.success).toBe(true);
      expect(result.agencyId).toBe('new-agency-uuid');
      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Agencia CIEE PE',
        description: 'Descrição longa sobre estagio',
        email: 'ciee@ciee.com',
        phone: '8133333333',
        cep: null,
        address: 'Rua Principal, 123',
        city: 'Recife',
        state: 'PE',
        agency_type: 'consultoria',
        website: null,
        instagram: null,
        latitude: null,
        longitude: null,
        status: 'pending',
        created_by: 'user-123',
      });
    });
  });
});
