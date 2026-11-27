import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Acceso con la banda verde: login, registro y recuperar contraseña.
 * El MID se simula con page.route, así las pruebas no necesitan el backend ni un correo real.
 */

async function sinGraves(page: Page) {
  const r = await new AxeBuilder({ page }).analyze();
  const graves = r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(graves).toEqual([]);
}

async function sinScrollHorizontal(page: Page) {
  const anchos = await page.evaluate(() => ({
    pagina: document.documentElement.scrollWidth,
    ventana: document.documentElement.clientWidth,
  }));
  expect(anchos.pagina).toBeLessThanOrEqual(anchos.ventana);
}

const PANTALLAS = [
  { nombre: 'login', ruta: '/#/login' },
  { nombre: 'registro', ruta: '/#/register' },
  { nombre: 'recuperar contraseña', ruta: '/#/recuperar-contrasena' },
];

for (const pantalla of PANTALLAS) {
  test(`${pantalla.nombre}: banda, axe sin infracciones graves y sin scroll horizontal`, async ({ page }) => {
    await page.goto(pantalla.ruta);
    await expect(page.locator('app-banda-seccion h1')).toBeVisible();
    await expect(page.locator('.acceso-tarjeta form')).toBeVisible();
    await sinGraves(page);
    await sinScrollHorizontal(page);
  });
}

test('login: tras la clave pasa al código con el foco puesto y muestra el error del MID en la tarjeta', async ({ page }) => {
  await page.route('**/v1/login', (ruta) =>
    ruta.fulfill({ json: { mensaje: 'Te enviamos un código', token_verificacion: 'tmp-123' } }),
  );
  await page.route('**/v1/login/verificar', (ruta) =>
    ruta.fulfill({ status: 401, json: { error: 'El código no es válido' } }),
  );

  await page.goto('/#/login');
  await page.getByLabel('Correo electrónico').fill('prueba@financeup.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave1234');

  const mostrar = page.getByRole('button', { name: 'Mostrar contraseña' });
  await mostrar.click();
  await expect(mostrar).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text');

  await page.getByRole('button', { name: 'Continuar' }).click();

  const codigo = page.getByLabel('Código de verificación');
  await expect(codigo).toBeFocused();
  await expect(page.locator('.acceso-pasos li').nth(1)).toHaveAttribute('aria-current', 'step');

  await codigo.fill('123456');
  await page.getByRole('button', { name: 'Verificar y entrar' }).click();
  await expect(page.locator('.acceso-tarjeta [role="alert"]')).toBeVisible();
  await expect(codigo).toBeFocused();
  await sinGraves(page);
});

test('login: no hay botones de redes sociales sin backend y los enlaces llevan a registro y recuperar', async ({ page }) => {
  await page.goto('/#/login');
  await expect(page.getByRole('button', { name: /Google|Apple|Facebook/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: '¿Olvidaste tu contraseña?' })).toHaveAttribute('href', /recuperar-contrasena/);
  await page.getByRole('link', { name: 'Crea una' }).click();
  await expect(page).toHaveURL(/#\/register$/);
});

test('registro: enviar vacío marca cada campo y lleva el foco al nombre', async ({ page }) => {
  await page.goto('/#/register');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  const nombre = page.getByLabel('Nombre');
  await expect(nombre).toBeFocused();
  await expect(nombre).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#reg-nombre-error')).toBeVisible();
  await expect(page.locator('#reg-correo-error')).toBeVisible();
  await expect(page.locator('#reg-terminos-error')).toBeVisible();

  await nombre.fill('Ana');
  await expect(page.locator('#reg-nombre-error')).toHaveCount(0);
  await sinGraves(page);
});

test('registro: las reglas de la contraseña se encienden al cumplirse', async ({ page }) => {
  await page.goto('/#/register');
  const reglas = page.locator('#reg-reglas li');
  await expect(page.locator('#reg-reglas li.ok')).toHaveCount(0);
  await page.getByLabel('Contraseña', { exact: true }).fill('clave');
  await expect(page.locator('#reg-reglas li.ok')).toHaveCount(0);
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave1234');
  await expect(page.locator('#reg-reglas li.ok')).toHaveCount(await reglas.count());
});

test('recuperar: correo, código y clave nueva hasta la confirmación, con el foco en cada paso', async ({ page }) => {
  await page.route('**/v1/recuperar-contrasena', (ruta) => ruta.fulfill({ json: { mensaje: 'ok' } }));

  await page.goto('/#/recuperar-contrasena');
  await page.getByRole('button', { name: 'Enviar código' }).click();
  await expect(page.locator('#rec-error')).toBeVisible();
  await expect(page.getByLabel('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');

  await page.getByLabel('Correo electrónico').fill('prueba@financeup.test');
  await page.getByRole('button', { name: 'Enviar código' }).click();

  const codigo = page.getByLabel('Código de verificación');
  await expect(codigo).toBeFocused();
  await codigo.fill('654321');
  await page.getByLabel('Contraseña nueva', { exact: true }).fill('Nueva1234');
  await page.getByLabel('Confirma la contraseña nueva').fill('Nueva1234');
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();

  await expect(page.getByRole('heading', { name: 'Contraseña actualizada' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Ir a iniciar sesión' })).toBeVisible();
  await sinGraves(page);
});
