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

const SESION = {
  mensaje: 'Inicio de sesion exitoso',
  token: 'token-de-prueba',
  expira_en: 3600,
  id_usuario: 7,
  nombre: 'Laura',
  apellido: 'Gómez',
  email: 'laura@ejemplo.com',
  estado: 'activo',
};

async function entrarConClave(page: Page) {
  await page.goto('/#/login');
  await page.getByLabel('Correo electrónico').fill('laura@ejemplo.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave1234');
  await page.getByRole('button', { name: 'Continuar' }).click();
}

test('login: el administrador entra directo a su panel, sin código', async ({ page }) => {
  await page.route('**/v1/login', (ruta) =>
    ruta.fulfill({ json: { ...SESION, rol: 'admin', requiere_codigo: false, debe_aceptar_politica: false } }),
  );
  await entrarConClave(page);
  await expect(page).toHaveURL(/#\/admin/);
  await expect(page.getByLabel('Código de verificación')).toHaveCount(0);
});

test('login: el usuario sin la política aceptada la acepta antes de entrar', async ({ page }) => {
  await page.route('**/v1/login', (ruta) =>
    ruta.fulfill({ json: { mensaje: 'Te enviamos un código', requiere_codigo: true, token_verificacion: 'tmp-1' } }),
  );
  await page.route('**/v1/login/verificar', (ruta) =>
    ruta.fulfill({ json: { ...SESION, rol: 'user', debe_aceptar_politica: true } }),
  );
  let cuerpo: Record<string, unknown> = {};
  await page.route('**/v1/perfil/7/politica', async (ruta) => {
    cuerpo = ruta.request().postDataJSON();
    await ruta.fulfill({ json: { id_usuario: 7, version_politica: '1.0' } });
  });

  await entrarConClave(page);
  await page.getByLabel('Código de verificación').fill('123456');
  await page.getByRole('button', { name: 'Verificar y entrar' }).click();
  await expect(page).toHaveURL(/#\/aceptar-politica/);
  await expect(page.locator('app-banda-seccion h1')).toContainText('Laura');
  await sinGraves(page);
  await sinScrollHorizontal(page);

  // Sin aceptar no puede ir a una pantalla privada
  await page.goto('/#/perfil');
  await expect(page).toHaveURL(/#\/aceptar-politica/);

  await page.getByRole('button', { name: 'Aceptar y continuar' }).click();
  await expect(page.locator('#pol-acepta-error')).toBeVisible();
  await expect(page.getByRole('checkbox')).toBeFocused();

  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Aceptar y continuar' }).click();
  await expect(page).toHaveURL(/#\/home/);
  expect(cuerpo).toEqual({ acepta_terminos: true, version_politica: '1.0' });
});

test('aceptar política: sin sesión manda al login', async ({ page }) => {
  await page.goto('/#/aceptar-politica');
  await expect(page).toHaveURL(/#\/login/);
});

test('registro: enviar vacío marca cada campo y lleva el foco al nombre', async ({ page }) => {
  await page.goto('/#/register');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  const nombre = page.getByLabel('Nombre');
  await expect(nombre).toBeFocused();
  await expect(nombre).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#reg-nombre-error')).toBeVisible();
  await expect(page.locator('#reg-correo-error')).toBeVisible();
  await expect(page.locator('#reg-fecha-error')).toHaveText('Escribe tu fecha de nacimiento.');
  await expect(page.locator('#reg-terminos-error')).toBeVisible();

  await nombre.fill('Ana');
  await expect(page.locator('#reg-nombre-error')).toHaveCount(0);
  await sinGraves(page);
});

test('registro: un menor de edad no puede crear la cuenta', async ({ page }) => {
  await page.goto('/#/register');
  const fecha = page.getByLabel('Fecha de nacimiento');
  const hoy = new Date();
  const anio = hoy.getFullYear() - 10;
  await fecha.fill(`${anio}-01-15`);
  await fecha.blur();
  await expect(page.locator('#reg-fecha-error')).toHaveText('FinanceUp es solo para mayores de 18 años.');
  await expect(fecha).toHaveAttribute('aria-invalid', 'true');

  await fecha.fill('1998-04-12');
  await expect(page.locator('#reg-fecha-error')).toHaveCount(0);
});

test('registro: envía la fecha y la versión de la política al MID', async ({ page }) => {
  let cuerpo: Record<string, unknown> = {};
  await page.route('**/v1/registro', async (ruta) => {
    cuerpo = ruta.request().postDataJSON();
    await ruta.fulfill({ status: 400, json: { error: 'Prueba: no se crea la cuenta' } });
  });

  await page.goto('/#/register');
  await page.getByLabel('Nombre').fill('Laura');
  await page.getByLabel('Apellido').fill('Gómez');
  await page.getByLabel('Correo electrónico').fill('laura@ejemplo.com');
  await page.getByLabel('Fecha de nacimiento').fill('1998-04-12');
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave1234');
  await page.getByLabel('Confirma la contraseña').fill('Clave1234');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await expect(page.getByRole('alert')).toBeVisible();
  expect(cuerpo).toMatchObject({ fecha_nacimiento: '1998-04-12', acepta_terminos: true, version_politica: '1.0' });
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
