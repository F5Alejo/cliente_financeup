import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de navegador (e2e) con Playwright.
 * Levanta `ng serve` en el puerto 4300 para no chocar con el servidor de desarrollo
 * y usa el Chrome instalado en el equipo (channel: 'chrome'), sin descargar navegadores.
 *
 *   npm run e2e          → corre todo en escritorio y móvil
 *   npm run e2e -- --ui  → modo visual para depurar
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:4300',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'movil', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
  webServer: {
    command: 'npx ng serve --port 4300',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
