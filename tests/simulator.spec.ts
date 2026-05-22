// tests/simulator.spec.ts
import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

test('Interview Simulator - Start Flow and Credit Validation', async ({ page }) => {
  // Set generous timeout for AI API response calls
  test.setTimeout(90_000);

  // 1. Perform login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set in .env.test');
  }

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('button[type="submit"]').click();

  // Wait for login redirect to home page
  await page.waitForURL('**/', { timeout: 15_000 });

  // 2. Navigate to Interview Simulator page
  await page.goto('/simulador-entrevistas');
  await page.waitForLoadState('networkidle');

  // 3. Credit validation check
  // The header displays user's available credits. Let's make sure the credits badge is visible.
  const creditsBadge = page.locator('span:has-text("créditos")');
  await expect(creditsBadge).toBeVisible({ timeout: 10_000 });

  // Get initial credits text to verify validation works
  const initialCreditsText = await creditsBadge.innerText();
  const initialCredits = parseInt(initialCreditsText.split(' ')[0], 10);
  console.log(`Initial Credits detected: ${initialCredits}`);
  expect(initialCredits).toBeGreaterThan(0);

  // 4. Click "Nova Simulação" to open setup view
  await page.locator('button:has-text("Nova Simulação")').click();

  // Verify setup view elements are visible
  await expect(page.locator('#jobTitle')).toBeVisible();
  await expect(page.locator('#jobDescription')).toBeVisible();

  // 5. Fill out the setup form
  await page.locator('#jobTitle').fill('Desenvolvedor React');
  await page.locator('#jobDescription').fill('Experiência com React, TypeScript, Tailwind CSS e testes unitários.');

  // Select "Líder Técnico" interviewer profile
  await page.locator('text=Líder Técnico').click();

  // 6. Submit form to start interview (this consumes 1 credit)
  await page.locator('button[type="submit"]:has-text("Iniciar Entrevista")').click();

  // 7. Verify simulation starts successfully
  // It should transition to chat view and display progress text "Perguntas Respondidas"
  await expect(page.locator('text=Perguntas Respondidas')).toBeVisible({ timeout: 45_000 });

  // Check that the first message from the IA interviewer is rendered
  const firstIAMessage = page.locator('text=IA').first();
  await expect(firstIAMessage).toBeVisible({ timeout: 30_000 });

  // Verify the input field for candidates' replies is visible
  const chatInput = page.locator('input[placeholder*="resposta"]');
  await expect(chatInput).toBeVisible();

  // 8. Go back to history
  // Click back button to return to history dashboard
  const backButton = page.locator('button:has(svg.lucide-arrow-left)').first();
  await backButton.click();

  // Verify we are back on history view and credits are updated (decreased by 1)
  await expect(page.locator('button:has-text("Nova Simulação")')).toBeVisible({ timeout: 10_000 });
  const updatedCreditsText = await creditsBadge.innerText();
  const updatedCredits = parseInt(updatedCreditsText.split(' ')[0], 10);
  console.log(`Updated Credits detected: ${updatedCredits}`);
  expect(updatedCredits).toBe(initialCredits - 1);
});
