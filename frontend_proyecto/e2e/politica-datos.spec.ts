import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Política de tratamiento de datos: legible, accesible y enlazada desde donde se piden datos. */

test('política: banda, índice, axe sin infracciones graves y sin scroll horizontal', async ({ page }) => {
  await page.goto('/#/politica-datos');
  await expect(page.locator('app-banda-seccion h1')).toContainText('Tus datos son tuyos');
  await expect(page.getByRole('navigation', { name: 'En esta página' }).getByRole('link')).toHaveCount(10);

  const r = await new AxeBuilder({ page }).analyze();
  const graves = r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(graves).toEqual([]);

  const anchos = await page.evaluate(() => ({
    pagina: document.documentElement.scrollWidth,
    ventana: document.documentElement.clientWidth,
  }));
  expect(anchos.pagina).toBeLessThanOrEqual(anchos.ventana);
});

test('política: el índice lleva a la sección de derechos', async ({ page }) => {
  await page.goto('/#/politica-datos');
  await page.getByRole('navigation', { name: 'En esta página' }).getByRole('link', { name: 'Tus derechos' }).click();
  await expect(page.getByRole('heading', { name: 'Tus derechos' })).toBeInViewport();
});

test('registro: la casilla de autorización enlaza la política en otra pestaña', async ({ page }) => {
  await page.goto('/#/register');
  const enlace = page.getByRole('link', { name: /política de tratamiento de datos/ });
  await expect(enlace).toHaveAttribute('href', /politica-datos/);
  await expect(enlace).toHaveAttribute('target', '_blank');
});

test('pie: enlaza la política de datos', async ({ page }) => {
  await page.goto('/#/home');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Política de datos' }).click();
  await expect(page).toHaveURL(/#\/politica-datos/);
});
