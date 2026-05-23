// tests/admin.spec.ts
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

test.describe('Admin Panel Security and Authorization Checks', () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ptogsfpkptzpuvdluxzf.supabase.co';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';

  let supabaseAdmin: any;

  test.beforeAll(async () => {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.test');
    }

    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 1. Temporarily change test user to student role for security check
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', process.env.TEST_USER_EMAIL!)
      .single();

    if (userError || !user) {
      throw new Error(`Test setup failed: could not locate user ${process.env.TEST_USER_EMAIL}`);
    }

    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ role: 'student' })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Test setup failed: could not set user to student: ${updateError.message}`);
    }
  });

  test.afterAll(async () => {
    // 2. Restore test user role to admin
    const { data: user } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', process.env.TEST_USER_EMAIL!)
      .single();

    if (user) {
      await supabaseAdmin
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Perform login as the test user (which is now a student)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password || !anonKey) {
      throw new Error('TEST_USER_EMAIL, TEST_USER_PASSWORD and VITE_SUPABASE_ANON_KEY must be set in .env.test');
    }

    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.locator('button[type="submit"]').click();

    // Wait for login redirect to home page
    await page.waitForURL('**/', { timeout: 15_000 });
  });

  test('Common user should be blocked from accessing /admin UI', async ({ page }) => {
    // Navigate directly to the admin page
    await page.goto('/admin');
    
    // The ProtectedRoute wrapper should block access and render "Permissão Insuficiente"
    const cardTitle = page.locator('text=Permissão Insuficiente');
    await expect(cardTitle).toBeVisible({ timeout: 15_000 });
  });

  test('Common user should be blocked from admin backend API endpoints', async ({ page }) => {
    // Retrieve authentication details from browser localStorage
    const authData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const authKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (!authKey) return null;
      const data = JSON.parse(localStorage.getItem(authKey) || '{}');
      return {
        token: data.access_token,
        userId: data.user?.id
      };
    });

    expect(authData).not.toBeNull();
    const { token, userId } = authData!;

    // 1. Attempt to GET /api/admin/users
    const usersResponse = await page.evaluate(async ({ url, token }) => {
      const res = await fetch(`${url}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return { status: res.status };
    }, { url: apiUrl, token });

    expect(usersResponse.status).toBe(403); // Forbidden

    // 2. Attempt to GET /api/admin/stats
    const statsResponse = await page.evaluate(async ({ url, token }) => {
      const res = await fetch(`${url}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return { status: res.status };
    }, { url: apiUrl, token });

    expect(statsResponse.status).toBe(403); // Forbidden

    // 3. Attempt to PUT /api/admin/users/:id/role (Privilege Escalation attempt on themselves)
    const roleResponse = await page.evaluate(async ({ url, token, userId }) => {
      const res = await fetch(`${url}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'admin' })
      });
      return { status: res.status };
    }, { url: apiUrl, token, userId });

    expect(roleResponse.status).toBe(403); // Forbidden
  });

  test('Database trigger should block direct client-side role and credit updates', async ({ page }) => {
    // Retrieve authentication details
    const authData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const authKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (!authKey) return null;
      const data = JSON.parse(localStorage.getItem(authKey) || '{}');
      return {
        token: data.access_token,
        userId: data.user?.id
      };
    });

    expect(authData).not.toBeNull();
    const { token, userId } = authData!;

    // Attempt to PATCH user_profiles directly via Supabase PostgREST client
    const escalationResult = await page.evaluate(async ({ url, anonKey, token, userId }) => {
      try {
        const res = await fetch(`${url}/rest/v1/user_profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'apikey': anonKey,
            'authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ role: 'admin' })
        });
        
        let errorData = '';
        if (!res.ok) {
          errorData = await res.text();
        }
        return { status: res.status, ok: res.ok, error: errorData };
      } catch (err: any) {
        return { error: err.message, status: 500, ok: false };
      }
    }, { url: supabaseUrl, anonKey: anonKey!, token, userId });

    // Assert that the direct database update was rejected
    expect(escalationResult.ok).toBe(false);
    // The DB trigger throws a customized RAISE EXCEPTION message which Supabase forwards in the body
    expect(escalationResult.error).toContain('Não autorizado a alterar cargo ou créditos diretamente.');
  });
});
