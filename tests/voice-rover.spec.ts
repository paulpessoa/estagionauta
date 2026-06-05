// tests/voice-rover.spec.ts
import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

test.describe('Voice Interaction and Rover Chat E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject Mock SpeechRecognition and SpeechSynthesis globally on every page navigation
    await page.addInitScript(() => {
      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = 'pt-BR';
        maxAlternatives = 1;

        onstart: (() => void) | null = null;
        onresult: ((event: any) => void) | null = null;
        onerror: ((event: any) => void) | null = null;
        onend: (() => void) | null = null;

        // Custom property to change the mocked response text dynamically if needed
        static mockText = 'Sim, tenho bastante experiência com desenvolvimento de APIs robustas em Node.js.';

        start() {
          if (this.onstart) {
            this.onstart();
          }

          // Simulate speech input after a short delay
          setTimeout(() => {
            if (this.onresult) {
              const fakeEvent = {
                resultIndex: 0,
                results: [
                  [
                    {
                      transcript: MockSpeechRecognition.mockText,
                      confidence: 1.0
                    }
                  ]
                ]
              };
              // Set final status of the results item
              Object.defineProperty(fakeEvent.results[0], 'isFinal', { value: true });
              this.onresult(fakeEvent);
            }

            setTimeout(() => {
              if (this.onend) {
                this.onend();
              }
            }, 100);
          }, 400);
        }

        stop() {
          if (this.onend) {
            this.onend();
          }
        }

        abort() {
          if (this.onend) {
            this.onend();
          }
        }
      }

      (window as any).SpeechRecognition = MockSpeechRecognition;
      (window as any).webkitSpeechRecognition = MockSpeechRecognition;

      // Mock speech synthesis to prevent errors and verify calls
      (window as any).speechSynthesis = {
        speak: () => {},
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        getVoices: () => [],
        speaking: false,
        pending: false,
        paused: false
      };
    });

    // Perform login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Dismiss cookie consent banner if present
    const cookieConsentBtn = page.locator('button:has-text("Aceitar Todos")');
    if (await cookieConsentBtn.isVisible()) {
      await cookieConsentBtn.click();
    }

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
  });

  test('Rover Widget - Voice Chat Flow', async ({ page }) => {
    test.setTimeout(45_000);

    // Rover should be visible as a floating trigger on the dashboard
    const roverCapsule = page.locator('img[alt="Rover Mascot"]').first();
    await expect(roverCapsule).toBeVisible({ timeout: 10_000 });

    // 1. Click to expand capsule and click again to open Rover drawer
    await roverCapsule.click();
    await page.waitForTimeout(500);
    await roverCapsule.click();

    // Verify input is open and visible
    const chatInput = page.locator('input[placeholder*="Rover"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Set the mock voice text specifically for the Rover conversation
    await page.evaluate(() => {
      (window as any).SpeechRecognition.mockText = 'Olá Rover, me mostre o saldo de créditos.';
    });

    // 2. Click "Falar" to start listening
    const speakButton = page.locator('button:has-text("Falar")');
    await expect(speakButton).toBeVisible();
    await speakButton.click();

    // Verify UI updates to "STOP" button (since the mock recognition triggers start)
    const stopButton = page.locator('button:has-text("STOP")');
    await expect(stopButton).toBeVisible({ timeout: 3000 });

    // Wait for the mock speech recognition to populate the input text
    await expect(chatInput).toHaveValue('Olá Rover, me mostre o saldo de créditos.', { timeout: 5000 });

    // 3. Click "STOP" to send the voice message
    await stopButton.click();

    // Verify message appears in chat log
    await expect(page.locator('text=Olá Rover, me mostre o saldo de créditos.').first()).toBeVisible({ timeout: 5000 });

    // Verify Rover responds
    await expect(page.locator('text=Créditos').first()).toBeVisible({ timeout: 20_000 });
  });

  test('Interview Simulator - Voice Input Flow', async ({ page }) => {
    test.setTimeout(90_000);

    // 1. Navigate to Interview Simulator
    await page.goto('/simulador-entrevistas');
    await page.waitForLoadState('networkidle');

    // 2. Click "Nova Simulação" to open setup view
    await page.locator('button:has-text("Nova Simulação")').click();

    // 3. Fill out the setup form
    await page.locator('#jobTitle').fill('Desenvolvedor Node.js');
    await page.locator('#jobDescription').fill('Experiência com APIs robustas e TypeScript.');
    await page.locator('text=Líder Técnico').click();

    // 4. Start interview
    await page.locator('button[type="submit"]:has-text("Iniciar Entrevista")').click();

    // Verify simulation starts successfully
    await expect(page.locator('text=Perguntas Respondidas')).toBeVisible({ timeout: 45_000 });

    // Check that the first message from the IA interviewer is rendered
    const firstIAMessage = page.locator('text=IA').first();
    await expect(firstIAMessage).toBeVisible({ timeout: 30_000 });

    // 5. Click "Modo Voz" if we are in text mode (default is text/voice toggle)
    const voiceModeButton = page.locator('button:has-text("Modo Voz")');
    if (await voiceModeButton.isVisible()) {
      await voiceModeButton.click();
    }

    // Set mock voice text for the interview answer
    await page.evaluate(() => {
      (window as any).SpeechRecognition.mockText = 'Sim, tenho bastante experiência com desenvolvimento de APIs robustas em Node.js.';
    });

    // 6. Click the large circular Mic button to start speaking
    const micButton = page.locator('button[title="Tocar para falar"]');
    await expect(micButton).toBeVisible();
    await micButton.click();

    // 7. Verify real-time transcription box appears with the recognized text
    const transcriptionText = page.locator('text=Sim, tenho bastante experiência com desenvolvimento de APIs robustas em Node.js.');
    await expect(transcriptionText).toBeVisible({ timeout: 5000 });

    // 8. Click the mic button again ("Parar gravação") to submit the voice answer
    const stopRecordingButton = page.locator('button[title="Parar gravação"]');
    await expect(stopRecordingButton).toBeVisible();
    await stopRecordingButton.click();

    // 9. Verify the interview transitions to "Pensando..." or moves to the next question
    await expect(page.locator('text=Pensando...')).toBeVisible({ timeout: 10_000 });
  });
});
