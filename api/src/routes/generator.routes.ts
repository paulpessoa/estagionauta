import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import { generateResumeAI } from '../services/openai.service.js';

const app = new Hono<Env>();

const resumeExperienceSchema = z.object({
  company: z.string().min(1, 'Empresa é obrigatória'),
  position: z.string().min(1, 'Cargo é obrigatório'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional().default(''),
  current: z.boolean().default(false),
  description: z.string().optional().default(''),
});

const resumeEducationSchema = z.object({
  institution: z.string().min(1, 'Instituição é obrigatória'),
  degree: z.string().min(1, 'Grau é obrigatório'),
  fieldOfStudy: z.string().min(1, 'Área de estudo é obrigatória'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional().default(''),
  current: z.boolean().default(false),
});

const resumeProjectSchema = z.object({
  name: z.string().min(1, 'Nome do projeto é obrigatório'),
  description: z.string().min(1, 'Descrição do projeto é obrigatória'),
  url: z.string().optional().nullable().default(''),
});

const resumeExtracurricularSchema = z.object({
  name: z.string().min(1, 'Nome do curso/atividade é obrigatório'),
  institution: z.string().optional().nullable().default(''),
  startDate: z.string().optional().nullable().default(''),
  endDate: z.string().optional().nullable().default(''),
  description: z.string().optional().nullable().default(''),
});

const generateResumeSchema = z.object({
  fullName: z.string().min(1, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  location: z.string().min(1, 'Localização é obrigatória'),
  website: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  github: z.string().optional().nullable(),
  summary: z.string().min(10, 'Resumo profissional deve ter pelo menos 10 caracteres'),
  experiences: z.array(resumeExperienceSchema).default([]),
  education: z.array(resumeEducationSchema).default([]),
  projects: z.array(resumeProjectSchema).optional().default([]),
  extracurriculars: z.array(resumeExtracurricularSchema).optional().default([]),
  skills: z.array(z.string()).min(1, 'Adicione pelo menos 1 habilidade'),
  languages: z.array(z.string()).optional().default([]),
  jobTitle: z.string().optional().nullable(),
  jobDescription: z.string().optional().nullable(),
});

// GET /api/generator - List user's generated resumes
app.get('/', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { data: resumes, error } = await supabaseAdmin
      .from('generated_resumes')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching generated resumes:', error);
      return c.json({ error: 'Erro ao buscar currículos gerados' }, 500);
    }

    return c.json(resumes ?? []);
  } catch (err) {
    console.error('Generator fetch error:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// GET /api/generator/:id - Fetch details of a specific resume
app.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  try {
    const { data: resume, error } = await supabaseAdmin
      .from('generated_resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !resume) {
      console.error('Error fetching resume detail:', error);
      return c.json({ error: 'Currículo não encontrado ou não autorizado' }, 404);
    }

    return c.json({
      id: resume.id,
      userId: resume.user_id,
      title: resume.title,
      profileData: resume.profile_data,
      content: resume.content,
      createdAt: resume.created_at,
    });
  } catch (err) {
    console.error('Generator detail error:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// POST /api/generator - Generate new resume
app.post('/', authMiddleware, zValidator('json', generateResumeSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

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

    if (profile.credits < 1) {
      return c.json(
        {
          error: 'Créditos insuficientes',
          requiredCredits: 1,
          availableCredits: profile.credits,
          message: 'Você precisa de pelo menos 1 crédito para gerar um currículo.',
        },
        402
      );
    }

    // 2. Consume credit
    const { data: consumeResult, error: consumeError } = await supabaseAdmin.rpc(
      'consume_credits',
      {
        user_uuid: user.id,
        amount: 1,
        description: `Geração de currículo: ${body.jobTitle || 'Profissional'}`,
      }
    );

    if (consumeError || !consumeResult) {
      console.error('Credits consumption error:', consumeError);
      return c.json({ error: 'Erro ao processar cobrança de créditos' }, 500);
    }

    // 3. Call OpenAI service to generate
    const content = await generateResumeAI(body);
    const title = body.jobTitle ? `Currículo - ${body.jobTitle}` : `Currículo - ${body.fullName}`;

    // 4. Save to database
    const { data: resumeData, error: saveError } = await supabaseAdmin
      .from('generated_resumes')
      .insert({
        user_id: user.id,
        title,
        profile_data: body,
        content,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving generated resume:', saveError);
      return c.json({
        success: true,
        title,
        content,
        message: 'Currículo gerado com sucesso, mas ocorreu um erro ao salvar no histórico.',
      });
    }

    return c.json({
      id: resumeData.id,
      userId: resumeData.user_id,
      title: resumeData.title,
      profileData: resumeData.profile_data,
      content: resumeData.content,
      createdAt: resumeData.created_at,
      remainingCredits: profile.credits - 1,
    }, 201);

  } catch (err) {
    console.error('Resume generation error:', err);
    return c.json({ error: 'Erro interno no servidor ao gerar currículo' }, 500);
  }
});

// PUT /api/generator/:id - Update generated resume content/title
app.put('/:id', authMiddleware, zValidator('json', z.object({
  content: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  title: z.string().optional(),
})), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.req.valid('json');

  try {
    const { data: existingResume, error: fetchError } = await supabaseAdmin
      .from('generated_resumes')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingResume) {
      return c.json({ error: 'Currículo não encontrado ou não autorizado' }, 404);
    }

    const updateData: any = { content: body.content };
    if (body.title) {
      updateData.title = body.title;
    }

    const { data: updatedResume, error: updateError } = await supabaseAdmin
      .from('generated_resumes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating resume:', updateError);
      return c.json({ error: 'Erro ao salvar alterações do currículo' }, 500);
    }

    return c.json({
      id: updatedResume.id,
      userId: updatedResume.user_id,
      title: updatedResume.title,
      profileData: updatedResume.profile_data,
      content: updatedResume.content,
      createdAt: updatedResume.created_at,
    });
  } catch (err) {
    console.error('Generator update error:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// DELETE /api/generator/:id - Delete generated resume
app.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  try {
    const { data: existingResume, error: fetchError } = await supabaseAdmin
      .from('generated_resumes')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingResume) {
      return c.json({ error: 'Currículo não encontrado ou não autorizado' }, 404);
    }

    const { error } = await supabaseAdmin
      .from('generated_resumes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting resume:', error);
      return c.json({ error: 'Erro ao excluir currículo' }, 500);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Generator delete error:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

export default app;
