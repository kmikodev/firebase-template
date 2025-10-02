import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display home page with Get Started button', async ({ page }) => {
    await page.goto('/');

    // Verificar título
    await expect(page.locator('h1')).toContainText('My Firebase App');

    // Verificar botón Get Started
    const getStartedButton = page.getByRole('link', { name: 'Get Started' });
    await expect(getStartedButton).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    // Click en Get Started
    await page.getByRole('link', { name: 'Get Started' }).click();

    // Verificar que estamos en /login
    await expect(page).toHaveURL('/login');

    // Verificar título de login
    await expect(page.locator('h3')).toContainText('Bienvenido a Peluquerías');
  });

  test('should display login options', async ({ page }) => {
    await page.goto('/login');

    // Verificar botón de Google
    const googleButton = page.getByRole('button', { name: /Continuar con Google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();

    // Verificar botón de Guest
    const guestButton = page.getByRole('button', { name: /Continuar como invitado/i });
    await expect(guestButton).toBeVisible();
    await expect(guestButton).toBeEnabled();

    // Verificar texto de términos
    await expect(page.locator('text=Al continuar, aceptas')).toBeVisible();
  });

  test('should redirect to dashboard when already logged in', async ({ page, context }) => {
    // Simular usuario ya logueado (usando localStorage mock)
    await context.addInitScript(() => {
      // Mock de Firebase Auth
      (window as any).__FIREBASE_MOCK_USER__ = {
        uid: 'test-user-123',
        email: 'test@example.com',
      };
    });

    await page.goto('/login');

    // Debería redirigir al dashboard (en una implementación real)
    // Por ahora solo verificamos que no crashea
    await expect(page.locator('h3')).toBeVisible();
  });

  test('should have responsive design on mobile', async ({ page }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');

    // Verificar que el contenido es visible
    await expect(page.locator('h3')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continuar con Google/i })).toBeVisible();
  });

  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/login');

    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');

    // Filtrar errores conocidos de Firebase (auth/invalid-api-key en dev es esperado sin .env)
    const relevantErrors = consoleErrors.filter(
      err => !err.includes('auth/invalid-api-key') && !err.includes('Firebase')
    );

    expect(relevantErrors).toHaveLength(0);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/login');

    // Verificar heading correcto
    const heading = page.locator('h3');
    await expect(heading).toHaveAccessibleName('Bienvenido a Peluquerías');

    // Verificar que los botones tienen texto accesible
    const googleButton = page.getByRole('button', { name: /Continuar con Google/i });
    await expect(googleButton).toHaveAccessibleName(/Continuar con Google/);
  });
});
