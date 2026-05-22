import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { generateNextInterviewQuestionAI, generateInterviewFeedbackAI } from '../services/openai.service.js';
import type { SimulatorMessage, InterviewSimulation } from '../../../shared/types/index.js';

const app = new Hono();

// Schema for starting a simulation
const startSimulationSchema = z.object({
  job_title: z.string().min(2, 'O título do cargo é obrigatório'),
  job_description: z.string().optional(),
  interviewer_type: z.string().min(2, 'O tipo de entrevistador é obrigatório'),
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
  const { job_title, job_description, interviewer_type } = c.req.valid('json');

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

    // 2. Generate the first question from the AI interviewer
    const firstQuestion = await generateNextInterviewQuestionAI(
      job_title,
      job_description || null,
      interviewer_type,
      [] // Empty message history
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

    const sim = simulation as InterviewSimulation;

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
    const MAX_ANSWERS = 5;

    let nextStatus = 'started';
    let feedback = null;

    if (candidateAnswersCount >= MAX_ANSWERS) {
      // 3a. Interview is finished, generate feedback report
      nextStatus = 'completed';
      try {
        feedback = await generateInterviewFeedbackAI(
          sim.job_title,
          sim.job_description,
          sim.interviewer_type,
          updatedMessages
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
          updatedMessages
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

export default app;
