import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Piloto de Playwright en el Libro mayor.
 * Recorrido: registrar un ingreso, verlo en la tabla, comprobar que el saldo cambia por el
 * importe exacto y que al cancelar una edición el foco vuelve al botón que abrió el formulario.
 * Corre en escritorio y en móvil (ver `projects` en playwright.config.ts).
 *
 * Hoy los movimientos viven en memoria (FinanzasService). Cuando el guardado vaya al MID,
 * sumar aquí la comprobación de persistencia después de `page.reload()`.
 */

const USUARIO_PRUEBA = { id: 1, email: 'prueba@financeup.test', nombre: 'Prueba', rol: 'user' };

/** "$ 1.850.000" → 1850000 */
function aPesos(texto: string): number {
  return Number(texto.replace(/\D/g, '')) || 0;
}

/** Lee las cifras de la banda. El saldo lleva signo: "Quedó" suma y "Faltó" resta. */
async function leerBanda(page: Page) {
  const cifras = page.locator('.banda-cifras');
  const entro = aPesos(await cifras.locator('div', { hasText: 'Entró' }).locator('dd').innerText());
  const saldoDiv = cifras.locator('div').nth(2);
  const etiqueta = await saldoDiv.locator('dt').innerText();
  const saldo = aPesos(await saldoDiv.locator('dd').innerText()) * (etiqueta.startsWith('Faltó') ? -1 : 1);
  return { entro, saldo };
}

test.beforeEach(async ({ page }) => {
  // Sesión simulada: el guard solo revisa que haya usuario guardado en sessionStorage.
  await page.addInitScript((usuario) => {
    sessionStorage.setItem('financeup_user', JSON.stringify(usuario));
  }, USUARIO_PRUEBA);
  await page.goto('/#/libro-mayor');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('registrar un ingreso lo agrega a la tabla y sube el saldo por el importe exacto', async ({ page }) => {
  const antes = await leerBanda(page);
  const concepto = 'Bono de prueba e2e';
  const importe = 1_250_000;

  const abrir = page.getByRole('button', { name: 'Nuevo movimiento' });
  await abrir.click();

  const dialogo = page.getByRole('dialog', { name: 'Nuevo movimiento' });
  await expect(dialogo).toBeVisible();
  // Al abrir, el foco va al primer campo (el importe).
  await expect(dialogo.getByLabel('¿Cuánto gastaste?')).toBeFocused();

  await dialogo.getByRole('radio', { name: 'Ingreso' }).check();
  await dialogo.getByLabel('¿Cuánto recibiste?').fill('1250000');
  await expect(dialogo.getByLabel('¿Cuánto recibiste?')).toHaveValue('1.250.000');
  await dialogo.getByLabel('Concepto').fill(concepto);
  await expect(dialogo.getByText('Se registra como')).toContainText('+$ 1.250.000');
  await dialogo.getByRole('button', { name: 'Registrar ingreso' }).click();

  await expect(dialogo).toBeHidden();
  await expect(page.getByText('Ingreso registrado.')).toBeVisible();
  await expect(abrir).toBeFocused();

  const fila = page.getByRole('row', { name: new RegExp(concepto) });
  await expect(fila).toBeVisible();
  await expect(fila).toContainText('+$ 1.250.000');

  const despues = await leerBanda(page);
  expect(despues.entro - antes.entro).toBe(importe);
  expect(despues.saldo - antes.saldo).toBe(importe);
});

test('cancelar una edición no cambia nada y devuelve el foco al botón Editar', async ({ page }) => {
  const editar = page.getByRole('button', { name: /^Editar / }).first();
  const nombre = (await editar.getAttribute('aria-label'))!.replace(/^Editar /, '');
  await editar.click();

  const dialogo = page.getByRole('dialog', { name: 'Editar movimiento' });
  await expect(dialogo).toBeVisible();
  await dialogo.getByLabel('Concepto').fill('Concepto que no se debe guardar');
  await dialogo.getByRole('button', { name: 'Cancelar' }).click();

  await expect(dialogo).toBeHidden();
  await expect(editar).toBeFocused();
  await expect(page.getByRole('row', { name: new RegExp(nombre) }).first()).toBeVisible();
  await expect(page.getByText('Concepto que no se debe guardar')).toHaveCount(0);
});

test('Esc cierra el formulario y el foco vuelve a Nuevo movimiento', async ({ page }) => {
  const abrir = page.getByRole('button', { name: 'Nuevo movimiento' });
  await abrir.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(abrir).toBeFocused();
});

test('eliminar pide confirmación con el foco en "No" y lo devuelve al cancelar', async ({ page }) => {
  const eliminar = page.getByRole('button', { name: /^Eliminar / }).first();
  await eliminar.click();
  const no = page.getByRole('button', { name: 'No', exact: true });
  await expect(no).toBeFocused();
  await no.click();
  await expect(eliminar).toBeFocused();
});

test('la página no se desborda a lo ancho (sin scroll horizontal)', async ({ page }) => {
  const anchos = await page.evaluate(() => ({
    pagina: document.documentElement.scrollWidth,
    ventana: document.documentElement.clientWidth,
  }));
  expect(anchos.pagina).toBeLessThanOrEqual(anchos.ventana);
});

test('sin infracciones graves de accesibilidad (axe) en la página y en el formulario', async ({ page }) => {
  const graves = (r: Awaited<ReturnType<AxeBuilder['analyze']>>) =>
    r.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);

  expect(graves(await new AxeBuilder({ page }).analyze())).toEqual([]);

  await page.getByRole('button', { name: 'Nuevo movimiento' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(graves(await new AxeBuilder({ page }).include('[role="dialog"]').analyze())).toEqual([]);
});
