import { Hono } from 'hono';
import { supabaseAdmin } from '../services/supabase.service.js';

const agencies = new Hono();

/**
 * GET /api/agencies
 * Public route — lists approved internship agencies with optional filters.
 * Used by the estagionauta-mcp server and the frontend.
 */
agencies.get('/', async (c) => {
  try {
    const query = c.req.query('query');
    const state = c.req.query('state');
    const city = c.req.query('city');
    const agencyType = c.req.query('agencyType');

    let dbQuery = supabaseAdmin
      .from('agencies')
      .select('id, name, description, email, phone, website, instagram, address, city, state, rating, total_reviews, agency_type, logo_url')
      .eq('status', 'approved');

    if (state) {
      dbQuery = dbQuery.ilike('state', state.trim());
    }

    if (city) {
      dbQuery = dbQuery.ilike('city', `%${city.trim()}%`);
    }

    if (agencyType) {
      dbQuery = dbQuery.eq('agency_type', agencyType);
    }

    const { data: agenciesList, error } = await dbQuery;

    if (error) {
      console.error('Error searching agencies:', error);
      return c.json({ error: 'Failed to search agencies.' }, 500);
    }

    // Client-side text filter for query
    let filtered = agenciesList || [];
    if (query) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q))
      );
    }

    return c.json({ success: true, count: filtered.length, agencies: filtered });
  } catch (err: any) {
    console.error('Agency search error:', err);
    return c.json({ error: 'Internal server error.' }, 500);
  }
});

/**
 * GET /api/agencies/:id
 * Public route — returns detailed info and approved reviews for a specific agency.
 * Used by the estagionauta-mcp server and the frontend.
 */
agencies.get('/:id', async (c) => {
  try {
    const agencyId = c.req.param('id');

    if (!agencyId) {
      return c.json({ error: 'Agency ID is required.' }, 400);
    }

    // 1. Fetch agency info
    const { data: agency, error: agencyErr } = await supabaseAdmin
      .from('agencies')
      .select('*')
      .eq('id', agencyId)
      .single();

    if (agencyErr || !agency) {
      console.error('Error fetching agency details:', agencyErr);
      return c.json({ error: 'Agency not found.' }, 404);
    }

    // 2. Fetch approved reviews
    const { data: reviews, error: reviewsErr } = await supabaseAdmin
      .from('agency_reviews')
      .select('id, rating, comment, created_at')
      .eq('agency_id', agencyId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (reviewsErr) {
      console.error('Error fetching agency reviews:', reviewsErr);
    }

    return c.json({ success: true, agency, reviews: reviews || [] });
  } catch (err: any) {
    console.error('Agency details error:', err);
    return c.json({ error: 'Internal server error.' }, 500);
  }
});

export default agencies;
