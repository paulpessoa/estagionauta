import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { generateNextInterviewQuestionAI, generateInterviewFeedbackAI } from '../services/openai.service.js';
import type { SimulatorMessage, InterviewSimulation } from '../../../shared/types/index.js';
import OpenAI from 'openai';
import { env } from '../config/env.js';

const app = new Hono();

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Schema for starting a simulation
const startSimulationSchema = z.object({
  job_title: z.string().min(2, 'O título do cargo é obrigatório'),
  job_description: z.string().optional(),
  interviewer_type: z.string().min(2, 'O tipo de entrevistador é obrigatório'),
  company_name: z.string().optional().nullable(),
  agency_id: z.string().uuid().optional().nullable(),
});

// Schema for sending an answer
const answerSchema = z.object({
  answer: z.string().min(1, 'A resposta não pode ser vazia'),
});

// GET /api/simulator/history - Get user's simulation history
app.get('/history', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { data: simulations, error } = await supabaseAdmin
      .from('interview_simulations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching simulations history:', error);
      return c.json({ error: 'Erro ao buscar histórico de simulações' }, 500);
    }

    return c.json({ simulations });
  } catch (err) {
    console.error('Unexpected error fetching simulations history:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// GET /api/simulator/:id - Get simulation details
app.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  try {
    const { data: simulation, error } = await supabaseAdmin
      .from('interview_simulations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !simulation) {
      console.error('Error fetching simulation details:', error);
      return c.json({ error: 'Simulação não encontrada' }, 404);
    }

    return c.json({ simulation });
  } catch (err) {
    console.error('Unexpected error fetching simulation details:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// POST /api/simulator/start - Start a new simulation (consumes 1 credit)
app.post('/start', authMiddleware, zValidator('json', startSimulationSchema), async (c) => {
  const user = c.get('user');
  const { job_title, job_description, interviewer_type, company_name, agency_id } = c.req.valid('json');

  try {
    // 1. Consume 1 credit
    const { data: consumeResult, error: consumeError } = await supabaseAdmin.rpc(
      'consume_credits',
      {
        user_uuid: user.id,
        amount: 1,
        description: 'Simulação de entrevista',
      }
    );

    if (consumeError || !consumeResult) {
      console.error('Credits consumption error:', consumeError);
      return c.json({ error: 'Créditos insuficientes para iniciar a simulação' }, 402);
    }

    // Fetch user profile to feed the AI interviewer
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name, course, university, period, bio, linkedin_url')
      .eq('id', user.id)
      .single();

    // 2. Generate the first question from the AI interviewer
    const firstQuestion = await generateNextInterviewQuestionAI(
      job_title,
      job_description || null,
      interviewer_type,
      [], // Empty message history
      profile || null,
      company_name || null
    );

    const initialMessages: SimulatorMessage[] = [
      {
        role: 'interviewer',
        content: firstQuestion,
        timestamp: new Date().toISOString(),
      },
    ];

    // 3. Save simulation in the DB
    const { data: simulationData, error: saveError } = await supabaseAdmin
      .from('interview_simulations')
      .insert({
        user_id: user.id,
        job_title,
        job_description: job_description || null,
        interviewer_type,
        status: 'started',
        messages: initialMessages,
        feedback: null,
        company_name: company_name || null,
        agency_id: agency_id || null,
      })
      .select()
      .single();

    if (saveError || !simulationData) {
      console.error('Error creating simulation in DB:', saveError);
      return c.json({ error: 'Erro ao registrar simulação de entrevista no banco de dados' }, 500);
    }

    return c.json({ simulation: simulationData });
  } catch (err) {
    console.error('Unexpected error starting simulation:', err);
    return c.json({ error: 'Erro interno ao iniciar simulação' }, 500);
  }
});

// POST /api/simulator/:id/answer - Submit candidate answer and get next question or feedback
app.post('/:id/answer', authMiddleware, zValidator('json', answerSchema), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const { answer } = c.req.valid('json');

  try {
    // 1. Retrieve the existing simulation
    const { data: simulation, error: fetchError } = await supabaseAdmin
      .from('interview_simulations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !simulation) {
      console.error('Error fetching simulation for answering:', fetchError);
      return c.json({ error: 'Simulação de entrevista não encontrada' }, 404);
    }

    const sim = simulation as any;

    if (sim.status === 'completed') {
      return c.json({ error: 'Esta entrevista já foi concluída' }, 400);
    }

    // 2. Add the candidate's answer to the messages array
    const updatedMessages: SimulatorMessage[] = [
      ...sim.messages,
      {
        role: 'candidate',
        content: answer,
        timestamp: new Date().toISOString(),
      },
    ];

    // Count how many times the candidate has answered
    const candidateAnswersCount = updatedMessages.filter(m => m.role === 'candidate').length;
    const MAX_ANSWERS = 5; // Limite de 5 perguntas conforme requisitos da plataforma

    let nextStatus = 'started';
    let feedback = null;

    // Fetch user profile to provide context to OpenAI
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name, course, university, period, bio, linkedin_url')
      .eq('id', user.id)
      .single();

    if (candidateAnswersCount >= MAX_ANSWERS) {
      // 3a. Interview is finished, generate feedback report
      nextStatus = 'completed';
      try {
        feedback = await generateInterviewFeedbackAI(
          sim.job_title,
          sim.job_description,
          sim.interviewer_type,
          updatedMessages,
          profile || null,
          sim.company_name
        );
      } catch (feedbackErr) {
        console.error('Error generating AI feedback:', feedbackErr);
        // Fallback mock feedback if AI fails so we don't block the user
        feedback = {
          score: 70,
          strengths: ['Participação completa na simulação de entrevista.'],
          improvements: ['Ocorreu uma instabilidade na geração do feedback personalizado detalhado pela IA.'],
          tips: 'Tente refazer a simulação mais tarde para receber a análise completa da nossa IA.',
        };
      }
    } else {
      // 3b. Generate the next question from the AI interviewer
      try {
        const nextQuestion = await generateNextInterviewQuestionAI(
          sim.job_title,
          sim.job_description,
          sim.interviewer_type,
          updatedMessages,
          profile || null,
          sim.company_name
        );
        updatedMessages.push({
          role: 'interviewer',
          content: nextQuestion,
          timestamp: new Date().toISOString(),
        });
      } catch (aiErr) {
        console.error('Error generating next AI question:', aiErr);
        return c.json({ error: 'Erro ao gerar próxima pergunta pela inteligência artificial' }, 500);
      }
    }

    // 4. Save updated simulation back to the DB
    const { data: updatedSimulation, error: updateError } = await supabaseAdmin
      .from('interview_simulations')
      .update({
        messages: updatedMessages,
        status: nextStatus,
        feedback: feedback,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedSimulation) {
      console.error('Error updating simulation in DB:', updateError);
      return c.json({ error: 'Erro ao atualizar simulação no banco de dados' }, 500);
    }

    return c.json({ simulation: updatedSimulation });
  } catch (err) {
    console.error('Unexpected error answering simulation:', err);
    return c.json({ error: 'Erro interno ao processar resposta' }, 500);
  }
});

// POST /api/simulator/:id/end - Force finish the interview and get feedback
app.post('/:id/end', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  try {
    const { data: simulation, error: fetchError } = await supabaseAdmin
      .from('interview_simulations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !simulation) {
      console.error('Error fetching simulation for ending:', fetchError);
      return c.json({ error: 'Simulação de entrevista não encontrada' }, 404);
    }

    const sim = simulation as any;

    if (sim.status === 'completed') {
      return c.json({ error: 'Esta entrevista já foi concluída' }, 400);
    }

    const candidateAnswersCount = sim.messages.filter((m: any) => m.role === 'candidate').length;
    if (candidateAnswersCount < 1) {
      return c.json({ error: 'Você precisa responder pelo menos 1 pergunta para poder encerrar a simulação' }, 400);
    }

    // Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name, course, university, period, bio, linkedin_url')
      .eq('id', user.id)
      .single();

    // Generate feedback report
    let feedback = null;
    try {
      feedback = await generateInterviewFeedbackAI(
        sim.job_title,
        sim.job_description,
        sim.interviewer_type,
        sim.messages,
        profile || null,
        sim.company_name
      );
    } catch (feedbackErr) {
      console.error('Error generating AI feedback:', feedbackErr);
      feedback = {
        score: 70,
        strengths: ['Participação completa na simulação de entrevista.'],
        improvements: ['Ocorreu uma instabilidade na geração do feedback personalizado detalhado pela IA.'],
        tips: 'Tente refazer a simulação mais tarde para receber a análise completa da nossa IA.',
      };
    }

    const { data: updatedSimulation, error: updateError } = await supabaseAdmin
      .from('interview_simulations')
      .update({
        status: 'completed',
        feedback: feedback,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedSimulation) {
      console.error('Error updating simulation in DB:', updateError);
      return c.json({ error: 'Erro ao encerrar simulação no banco de dados' }, 500);
    }

    return c.json({ simulation: updatedSimulation });
  } catch (err) {
    console.error('Unexpected error ending simulation:', err);
    return c.json({ error: 'Erro interno ao processar encerramento' }, 500);
  }
});

// DELETE /api/simulator/:id - Delete specific simulation
app.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  try {
    const { error } = await supabaseAdmin
      .from('interview_simulations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Simulation deletion error:', error);
      return c.json({ error: 'Erro ao excluir a simulação ou permissão negada' }, 500);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Simulation delete error:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// POST /api/simulator/tts - Generate Text-to-Speech audio (with Supabase Storage cache)
app.post('/tts', authMiddleware, zValidator('json', z.object({ 
  text: z.string().min(1),
  voice: z.string().optional()
})), async (c) => {
  const user = c.get('user');
  const { text, voice } = c.req.valid('json');

  // Check subscription status
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('user_profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile) {
    return c.json({ error: 'Erro ao verificar perfil' }, 500);
  }

  if (profile.subscription_status !== 'premium') {
    return c.json({ error: 'OpenAI TTS is only available for premium users' }, 403);
  }

  const VALID_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  const selectedVoice = (voice && VALID_VOICES.includes(voice)) ? voice : 'nova';

  // Build a deterministic cache key from content
  const { createHash } = await import('crypto');
  const cacheKey = createHash('sha256').update(`${selectedVoice}:${text}`).digest('hex');
  const storagePath = `tts-cache/${cacheKey}.mp3`;

  const BUCKET = 'simulator-audio';

  try {
    // 1. Check cache in Supabase Storage
    const { data: cached } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(storagePath);

    if (cached) {
      // Cache hit – return stored audio directly
      const arrayBuffer = await cached.arrayBuffer();
      c.header('Content-Type', 'audio/mpeg');
      c.header('Content-Length', arrayBuffer.byteLength.toString());
      c.header('X-Cache', 'HIT');
      return c.body(arrayBuffer);
    }
  } catch {
    // Cache miss or bucket error – proceed to generate
  }

  try {
    // 2. Generate audio via OpenAI
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice as any,
      input: text,
    });

    const arrayBuffer = await mp3.arrayBuffer();

    // 3. Store in Supabase Storage for future requests (fire-and-forget)
    supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      })
      .catch((err) => console.error('TTS cache upload failed:', err));

    c.header('Content-Type', 'audio/mpeg');
    c.header('Content-Length', arrayBuffer.byteLength.toString());
    c.header('X-Cache', 'MISS');
    return c.body(arrayBuffer);
  } catch (err) {
    console.error('Error generating TTS:', err);
    return c.json({ error: 'Erro ao gerar áudio' }, 500);
  }
});

export default app;
