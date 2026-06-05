import { vi, describe, it, expect, beforeEach } from 'vitest';
import app from '../app.js';
import { encrypt, decrypt } from '../services/crypto.service.js';
import { supabaseAdmin } from '../services/supabase.service.js';

// Mock env configuration
vi.mock('../config/env.js', () => {
  return {
    env: {
      CLIENT_URL: 'http://localhost:5173',
      PORT: '3001',
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://mock.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
      BYOK_ENCRYPTION_KEY: 'e87e6fa50b69dc0ff46eaed3e75ca5fb495242b5da2946043eba523a837aa381',
      OPENAI_API_KEY: 'mock-openai-key',
      GEMINI_API_KEY: 'mock-gemini-key',
    }
  };
});

// Mock Supabase service
vi.mock('../services/supabase.service.js', () => {
  return {
    supabaseAdmin: {
      from: vi.fn(),
      rpc: vi.fn(),
      auth: {
        getUser: vi.fn().mockImplementation((token) => {
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
        })
      }
    },
  };
});

// Mock OpenAI service helper functions
vi.mock('../services/openai.service.js', () => {
  return {
    generateNextInterviewQuestionAI: vi.fn().mockResolvedValue('Mocked first interview question?'),
    generateInterviewFeedbackAI: vi.fn().mockResolvedValue({ score: 90, strengths: ['Good'], improvements: ['None'], tips: 'None' }),
  };
});

// Mock global fetch for API key validations
const mockFetch = vi.fn().mockImplementation((url) => {
  if (url.includes('generateContent')) {
    return Promise.resolve({
      status: 200,
      json: async () => ({})
    });
  }
  if (url.includes('models')) {
    return Promise.resolve({
      status: 200,
      json: async () => ({})
    });
  }
  return Promise.resolve({
    status: 404
  });
});
global.fetch = mockFetch as any;

describe('BYOK Encryption & Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Crypto service AES-256-GCM functions', () => {
    it('encrypts and decrypts text successfully', () => {
      const originalText = 'sk-1234567890abcdefghijklmnopqrstuvwxyz';
      const encrypted = encrypt(originalText);
      expect(encrypted.ciphertext).not.toBe(originalText);
      
      const decrypted = decrypt(encrypted.ciphertext, encrypted.iv, encrypted.tag);
      expect(decrypted).toBe(originalText);
    });
  });

  describe('User keys endpoints', () => {
    it('GET /api/user/keys/status returns status indicating no keys initially', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { encrypted_gemini_key: null, encrypted_openai_key: null },
              error: null
            })
          })
        })
      } as any);

      const res = await app.request('/api/user/keys/status', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-test-token'
        }
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.hasGeminiKey).toBe(false);
      expect(body.hasOpenaiKey).toBe(false);
    });

    it('POST /api/user/keys validates and stores encrypted keys', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });
      vi.mocked(supabaseAdmin.from).mockImplementation((tableName) => {
        if (tableName === 'user_profiles') {
          return { update: mockUpdate } as any;
        }
        return {} as any;
      });

      const res = await app.request('/api/user/keys', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          geminiKey: 'AIzaSyTestKey123',
          openaiKey: 'sk-TestKey123'
        })
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        encrypted_gemini_key: expect.any(String),
        gemini_key_iv: expect.any(String),
        gemini_key_tag: expect.any(String),
        encrypted_openai_key: expect.any(String),
        openai_key_iv: expect.any(String),
        openai_key_tag: expect.any(String),
      }));
    });

    it('DELETE /api/user/keys/:provider removes a specific key', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      });
      vi.mocked(supabaseAdmin.from).mockImplementation((tableName) => {
        if (tableName === 'user_profiles') {
          return { update: mockUpdate } as any;
        }
        return {} as any;
      });

      const res = await app.request('/api/user/keys/gemini', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer valid-test-token'
        }
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        encrypted_gemini_key: null,
        gemini_key_iv: null,
        gemini_key_tag: null,
      });
    });
  });

  describe('Integration with Simulator - Credit Bypass', () => {
    it('bypasses credit consumption when custom keys exist', async () => {
      // Mock user has configured gemini key
      const encrypted = encrypt('AIzaSyCustomUserGeminiKey');
      vi.mocked(supabaseAdmin.from).mockImplementation((tableName) => {
        if (tableName === 'user_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    credits: 5,
                    full_name: 'Jane Doe',
                    encrypted_gemini_key: encrypted.ciphertext,
                    gemini_key_iv: encrypted.iv,
                    gemini_key_tag: encrypted.tag,
                    encrypted_openai_key: null,
                    openai_key_iv: null,
                    openai_key_tag: null,
                  },
                  error: null
                })
              })
            })
          } as any;
        }
        if (tableName === 'interview_simulations') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'new-simulation-id', messages: [] },
                  error: null
                })
              })
            })
          } as any;
        }
        return {} as any;
      });

      const res = await app.request('/api/simulator/start', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_title: 'Full Stack Developer',
          interviewer_type: 'tech',
        })
      });

      expect(res.status).toBe(200);
      // Ensure consume_credits was NOT called
      expect(vi.mocked(supabaseAdmin.rpc)).not.toHaveBeenCalledWith('consume_credits', expect.any(Object));
    });
  });
});
