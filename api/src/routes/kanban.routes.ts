import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, type Env } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../services/supabase.service.js';

const app = new Hono<Env>();

const jobApplicationSchema = z.object({
  company: z.string().min(1, 'Empresa é obrigatória'),
  position: z.string().min(1, 'Cargo é obrigatório'),
  status: z.enum(['interested', 'applied', 'interview', 'test', 'offer', 'rejected']),
  appliedDate: z.string(),
  description: z.string().optional().default(''),
  salary: z.string().optional().nullable(),
  location: z.string().optional().default(''),
  contactPerson: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
  nextActionDate: z.string().optional().nullable(),
  notes: z.string().optional().default(''),
  imageUrl: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  statusHistory: z.array(z.object({
    status: z.enum(['interested', 'applied', 'interview', 'test', 'offer', 'rejected']),
    date: z.string(),
  })).optional(),
  feedbacks: z.array(z.object({
    author: z.string().optional(),
    text: z.string(),
    date: z.string(),
  })).optional(),
});

const reminderSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional().default(''),
  date: z.string(),
  completed: z.boolean().default(false),
  type: z.enum(['call', 'email', 'test', 'interview', 'follow-up', 'deadline']),
});

const getProgressFromStatus = (status: string): number => {
  const map: Record<string, number> = {
    interested: 0,
    applied: 20,
    test: 50,
    interview: 75,
    offer: 100,
    rejected: 100
  };
  return map[status] ?? 0;
};

// GET /api/kanban - Fetch all applications and reminders for the user
app.get('/', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const { data: applications, error: appError } = await supabaseAdmin
      .from('kanban_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (appError) {
      console.error('Error fetching applications:', appError);
      return c.json({ error: 'Erro ao buscar candidaturas' }, 500);
    }

    if (!applications || applications.length === 0) {
      return c.json([]);
    }

    // Fetch reminders for all fetched applications
    const applicationIds = applications.map((app) => app.id);
    const { data: reminders, error: remError } = await supabaseAdmin
      .from('kanban_reminders')
      .select('*')
      .in('application_id', applicationIds);

    if (remError) {
      console.error('Error fetching reminders:', remError);
      return c.json({ error: 'Erro ao buscar lembretes das candidaturas' }, 500);
    }

    // Map reminders to their respective applications
    const remindersByAppId = (reminders ?? []).reduce((acc: any, reminder) => {
      if (!acc[reminder.application_id]) {
        acc[reminder.application_id] = [];
      }
      acc[reminder.application_id].push({
        id: reminder.id,
        title: reminder.title,
        description: reminder.description,
        date: reminder.date,
        completed: reminder.completed,
        type: reminder.type,
      });
      return acc;
    }, {});

    const mappedApplications = applications.map((app) => ({
      id: app.id,
      company: app.company,
      position: app.position,
      status: app.status,
      appliedDate: app.applied_date,
      description: app.description,
      salary: app.salary,
      location: app.location,
      contactPerson: app.contact_person,
      contactEmail: app.contact_email,
      contactPhone: app.contact_phone,
      website: app.website,
      progress: app.progress,
      nextAction: app.next_action,
      nextActionDate: app.next_action_date,
      notes: app.notes,
      imageUrl: app.image_url,
      tags: app.tags,
      statusHistory: app.status_history ?? [],
      feedbacks: app.feedbacks ?? [],
      reminders: remindersByAppId[app.id] ?? [],
    }));

    return c.json(mappedApplications);
  } catch (err) {
    console.error('Kanban fetch error:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// POST /api/kanban - Create new application
app.post('/', authMiddleware, zValidator('json', jobApplicationSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  try {
    const initialHistory = body.statusHistory && body.statusHistory.length > 0
      ? body.statusHistory
      : [{ status: body.status, date: new Date().toISOString() }];

    const { data: appData, error } = await supabaseAdmin
      .from('kanban_applications')
      .insert({
        user_id: user.id,
        company: body.company,
        position: body.position,
        status: body.status,
        applied_date: body.appliedDate,
        description: body.description,
        salary: body.salary,
        location: body.location,
        contact_person: body.contactPerson,
        contact_email: body.contactEmail,
        contact_phone: body.contactPhone,
        website: body.website,
        progress: getProgressFromStatus(body.status),
        next_action: body.nextAction,
        next_action_date: body.nextActionDate,
        notes: body.notes,
        image_url: body.imageUrl,
        tags: body.tags,
        status_history: initialHistory,
        feedbacks: body.feedbacks ?? [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return c.json({ error: `Erro ao criar candidatura: ${error.message || JSON.stringify(error)}` }, 500);
    }

    return c.json({
      ...appData,
      appliedDate: appData.applied_date,
      contactPerson: appData.contact_person,
      contactEmail: appData.contact_email,
      contactPhone: appData.contact_phone,
      nextAction: appData.next_action,
      nextActionDate: appData.next_action_date,
      imageUrl: appData.image_url,
      statusHistory: appData.status_history ?? [],
      feedbacks: appData.feedbacks ?? [],
      reminders: [],
    }, 201);
  } catch (err) {
    console.error('Kanban create error:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// PUT /api/kanban/:id - Update application
app.put('/:id', authMiddleware, zValidator('json', jobApplicationSchema.partial()), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.req.valid('json');

  try {
    // Verify ownership and fetch current status history
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('kanban_applications')
      .select('id, status, status_history, feedbacks')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingApp) {
      return c.json({ error: 'Candidatura não encontrada ou não autorizada' }, 404);
    }

    // Map incoming fields to database fields
    const updateData: any = {};
    if (body.company !== undefined) updateData.company = body.company;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.appliedDate !== undefined) updateData.applied_date = body.appliedDate;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.salary !== undefined) updateData.salary = body.salary;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.contactPerson !== undefined) updateData.contact_person = body.contactPerson;
    if (body.contactEmail !== undefined) updateData.contact_email = body.contactEmail;
    if (body.contactPhone !== undefined) updateData.contact_phone = body.contactPhone;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.nextAction !== undefined) updateData.next_action = body.nextAction;
    if (body.nextActionDate !== undefined) updateData.next_action_date = body.nextActionDate;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl;
    if (body.tags !== undefined) updateData.tags = body.tags;

    // Handle status history transition appending
    if (body.status !== undefined) {
      updateData.status = body.status;
      updateData.progress = getProgressFromStatus(body.status);
      if (body.status !== existingApp.status) {
        const currentHistory = Array.isArray(existingApp.status_history)
          ? existingApp.status_history
          : [];
        updateData.status_history = [
          ...currentHistory,
          { status: body.status, date: new Date().toISOString() }
        ];
      }
    } else if (body.statusHistory !== undefined) {
      updateData.status_history = body.statusHistory;
    }

    if (body.feedbacks !== undefined) {
      updateData.feedbacks = body.feedbacks;
    }

    const { data: updatedApp, error } = await supabaseAdmin
      .from('kanban_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return c.json({ error: 'Erro ao atualizar candidatura' }, 500);
    }

    return c.json({
      ...updatedApp,
      appliedDate: updatedApp.applied_date,
      contactPerson: updatedApp.contact_person,
      contactEmail: updatedApp.contact_email,
      contactPhone: updatedApp.contact_phone,
      nextAction: updatedApp.next_action,
      nextActionDate: updatedApp.next_action_date,
      imageUrl: updatedApp.image_url,
      statusHistory: updatedApp.status_history ?? [],
      feedbacks: updatedApp.feedbacks ?? [],
    });
  } catch (err) {
    console.error('Kanban update error:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// DELETE /api/kanban/:id - Delete application
app.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  try {
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('kanban_applications')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingApp) {
      return c.json({ error: 'Candidatura não encontrada ou não autorizada' }, 404);
    }

    const { error } = await supabaseAdmin
      .from('kanban_applications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting application:', error);
      return c.json({ error: 'Erro ao excluir candidatura' }, 500);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Kanban delete error:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// POST /api/kanban/:id/reminders - Create reminder
app.post('/:id/reminders', authMiddleware, zValidator('json', reminderSchema), async (c) => {
  const user = c.get('user');
  const applicationId = c.req.param('id');
  const body = c.req.valid('json');

  try {
    // Check ownership of application
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('kanban_applications')
      .select('id')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingApp) {
      return c.json({ error: 'Candidatura não encontrada ou não autorizada' }, 404);
    }

    const { data: reminderData, error } = await supabaseAdmin
      .from('kanban_reminders')
      .insert({
        application_id: applicationId,
        title: body.title,
        description: body.description,
        date: body.date,
        completed: body.completed,
        type: body.type,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reminder:', error);
      return c.json({ error: 'Erro ao criar lembrete' }, 500);
    }

    return c.json(reminderData, 201);
  } catch (err) {
    console.error('Reminder create error:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// PUT /api/kanban/:id/reminders/:reminderId - Update reminder
app.put('/:id/reminders/:reminderId', authMiddleware, zValidator('json', reminderSchema.partial()), async (c) => {
  const user = c.get('user');
  const applicationId = c.req.param('id');
  const reminderId = c.req.param('reminderId');
  const body = c.req.valid('json');

  try {
    // Check ownership of application
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('kanban_applications')
      .select('id')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingApp) {
      return c.json({ error: 'Candidatura não encontrada ou não autorizada' }, 404);
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.completed !== undefined) updateData.completed = body.completed;
    if (body.type !== undefined) updateData.type = body.type;

    const { data: reminderData, error } = await supabaseAdmin
      .from('kanban_reminders')
      .update(updateData)
      .eq('id', reminderId)
      .eq('application_id', applicationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reminder:', error);
      return c.json({ error: 'Erro ao atualizar lembrete' }, 500);
    }

    return c.json(reminderData);
  } catch (err) {
    console.error('Reminder update error:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

// DELETE /api/kanban/:id/reminders/:reminderId - Delete reminder
app.delete('/:id/reminders/:reminderId', authMiddleware, async (c) => {
  const user = c.get('user');
  const applicationId = c.req.param('id');
  const reminderId = c.req.param('reminderId');

  try {
    // Check ownership of application
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('kanban_applications')
      .select('id')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingApp) {
      return c.json({ error: 'Candidatura não encontrada ou não autorizada' }, 404);
    }

    const { error } = await supabaseAdmin
      .from('kanban_reminders')
      .delete()
      .eq('id', reminderId)
      .eq('application_id', applicationId);

    if (error) {
      console.error('Error deleting reminder:', error);
      return c.json({ error: 'Erro ao excluir lembrete' }, 500);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Reminder delete error:', err);
    return c.json({ error: 'Erro interno no servidor' }, 500);
  }
});

export default app;
