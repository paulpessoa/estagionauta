import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { analyzeResumeAI, type AnalysisOutput } from '../services/openai.service.js';

const app = new Hono<Env>();

const analyzeSchema = z.object({
  resumeText: z.string().min(50, 'O currículo deve ter pelo menos 50 caracteres'),
  jobDescription: z.string().optional(),
  currentSituation: z.string().optional(),
  mentorshipQuestions: z.string().optional(),
});

// Helper: fallback analysis generator
function generateFallbackAnalysis(resumeText: string, currentSituation?: string) {
  const wordCount = resumeText.split(/\s+/).length;
  const hasExperience = /(experiência|trabalho|estágio|atuei|cargo)/i.test(resumeText);
  const hasEducation = /(curso|graduação|universidade|faculdade|ensino)/i.test(resumeText);
  const hasSkills = /(habilidades|competências|conhecimento|tecnologia)/i.test(resumeText);

  let scoreGeral = 50;
  if (wordCount > 200) scoreGeral += 10;
  if (hasExperience) scoreGeral += 15;
  if (hasEducation) scoreGeral += 10;
  if (hasSkills) scoreGeral += 15;

  let adequacaoMercado = Math.max(0, Math.min(100, scoreGeral + Math.floor(Math.random() * 20) - 10));
  let potencialCrescimento = Math.max(0, Math.min(100, scoreGeral + Math.floor(Math.random() * 20) - 10));

  return {
    pontosFortes: [
      'Currículo estruturado e organizado',
      'Informações profissionais apresentadas de forma clara',
      'Formação acadêmica relevante descrita',
    ],
    areasMelhoria: [
      'Considerar adicionar mais detalhes sobre realizações e conquistas',
      'Incluir métricas e resultados quantitativos nas experiências',
      'Destacar mais soft skills e competências interpessoais',
    ],
    recomendacoes: [
      'Quantifique os seus resultados profissionais (ex: aumento de performance, metas batidas)',
      'Inclua palavras-chave específicas da sua área de atuação',
      'Revise a formatação para destacar as sessões principais',
    ],
    scoreGeral,
    adequacaoMercado,
    potencialCrescimento,
    resumo: 'Análise realizada em modo de contingência. Recomenda-se revisão e aprimoramento contínuo das seções apresentadas.',
  };
}

// POST /api/analysis/analyze - Analyze resume using AI
app.post('/analyze', authMiddleware, zValidator('json', analyzeSchema), async (c) => {
  const user = c.get('user');
  const { resumeText, jobDescription, currentSituation, mentorshipQuestions } = c.req.valid('json');

  try {
    // 1. Check user credits balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return c.json({ error: 'Erro ao verificar créditos do usuário' }, 500);
    }

    if (profile.credits < 3) {
      return c.json(
        {
          error: 'Créditos insuficientes',
          requiredCredits: 3,
          availableCredits: profile.credits,
          message: 'Você precisa de 3 créditos para realizar uma análise de currículo.',
        },
        402
      );
    }

    // 2. Consume credits using atomic RPC
    const { data: consumeResult, error: consumeError } = await supabaseAdmin.rpc(
      'consume_credits',
      {
        user_uuid: user.id,
        amount: 3,
        description: 'Análise de currículo com IA',
      }
    );

    if (consumeError || !consumeResult) {
      console.error('Credits consumption error:', consumeError);
      return c.json({ error: 'Erro ao processar cobrança de créditos' }, 500);
    }

    // 3. Request analysis from OpenAI or use fallback
    let analysisResult: AnalysisOutput;
    let usedFallback = false;

    try {
      analysisResult = await analyzeResumeAI({
        resumeText,
        jobDescription,
        currentSituation,
        mentorshipQuestions,
      });
    } catch (aiErr) {
      console.error('OpenAI call failed, using fallback generator:', aiErr);
      analysisResult = generateFallbackAnalysis(resumeText, currentSituation);
      usedFallback = true;
    }

    // 4. Save analysis results to database
    const { data: insertData, error: saveError } = await supabaseAdmin
      .from('curriculum_analysis')
      .insert({
        user_id: user.id,
        resume_text: resumeText,
        job_description: jobDescription || null,
        current_situation: currentSituation || null,
        mentorship_questions: mentorshipQuestions || null,
        analysis_result: analysisResult,
        used_fallback: usedFallback,
        credits_used: 3,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('Error saving curriculum analysis:', saveError);
      // Even if saving to history fails, return the analysis to the user as they paid credits
    }

    return c.json({
      success: true,
      analysisId: insertData?.id,
      analysis: analysisResult,
      usedFallback,
      creditsUsed: 3,
      remainingCredits: profile.credits - 3,
    });
  } catch (err) {
    console.error('Analysis error:', err);
    return c.json({ error: 'Erro interno do servidor ao analisar currículo' }, 500);
  }
});

// GET /api/analysis/history - Fetch analysis history
app.get('/history', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { data: history, error } = await supabaseAdmin
      .from('curriculum_analysis')
      .select('id, created_at, job_description, used_fallback, credits_used, analysis_result')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('History fetch error:', error);
      return c.json({ error: 'Erro ao carregar histórico de análises' }, 500);
    }

    return c.json(history ?? []);
  } catch (err) {
    console.error('History route error:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// GET /api/analysis/:id - Get specific analysis details
app.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  try {
    const { data: analysis, error } = await supabaseAdmin
      .from('curriculum_analysis')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !analysis) {
      console.error('Analysis details fetch error:', error);
      return c.json({ error: 'Análise não encontrada ou acesso não autorizado' }, 404);
    }

    return c.json(analysis);
  } catch (err) {
    console.error('Details route error:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

export default app;
