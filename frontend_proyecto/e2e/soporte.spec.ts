import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Soporte con la banda verde: línea de ayuda, habla con nosotros, nueva PQR y detalle de PQR.
 * Cada pantalla se revisa con axe (sin infracciones graves) y sin scroll horizontal, en escritorio y móvil.
 * El detalle de la PQR y el envío usan respuestas simuladas del MID (page.route), así no hace falta el backend.
 */

const USUARIO_PRUEBA = { id: 1, email: 'prueba@financeup.test', nombre: 'Prueba', rol: 'user' };

const DETALLE_PQR = {
  id_pqr: 7,
  radicado: 'PQR-2026-0007',
  titulo: 'Cobro repetido en mi cuenta',
  tipo: 'reclamo',
  categoria: 'Movimientos y pagos',
  prioridad: 'alta',
  estado: 'En Revision',
  progreso: 50,
  descripcion: 'El 18 de noviembre me cobraron dos veces la misma cuota del crédito.',
  asesor: 'Laura Gómez',
  usuario: 'Prueba',
  fecha_creacion: '2026-11-20T14:21:23Z',
  ultima_actualizacion: '2026-11-22T09:00:00Z',
  mensaje_respuesta: 'Estamos revisando el cobro con la entidad aliada.',
  respuestas: [{ autor: 'Laura Gómez', mensaje: '¿Nos compartes el comprobante?', fecha: '2026-11-21T10:00:00Z' }],
  adjuntos: [{ nombre: 'extracto.pdf', ruta: '', tipo: 'application/pdf', tamano: 2048 }],
};

async function conSesion(page: Page) {
  await page.addInitScript((usuario) => {
    sessionStorage.setItem('financeup_user', JSON.stringify(usuario));
  }, USUARIO_PRUEBA);
}

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
  { nombre: 'línea de ayuda', ruta: '/#/linea-ayuda', sesion: false },
  { nombre: 'habla con nosotros', ruta: '/#/habla-con-nosotros', sesion: false },
  { nombre: 'nueva PQR', ruta: '/#/nuevo-pqr', sesion: true },
  { nombre: 'detalle de PQR', ruta: `/#/ver-pqr/${DETALLE_PQR.radicado}`, sesion: true },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/v1/pqr/radicado/**', (ruta) => ruta.fulfill({ json: DETALLE_PQR }));
});

for (const pantalla of PANTALLAS) {
  test(`${pantalla.nombre}: banda, axe sin infracciones graves y sin scroll horizontal`, async ({ page }) => {
    if (pantalla.sesion) await conSesion(page);
    await page.goto(pantalla.ruta);
    await expect(page.locator('app-banda-seccion h1')).toBeVisible();
    await sinGraves(page);
    await sinScrollHorizontal(page);
  });
}

test('línea de ayuda: buscar filtra las preguntas y el acordeón anuncia si está abierto', async ({ page }) => {
  await page.goto('/#/linea-ayuda');
  await page.getByRole('searchbox', { name: 'Buscar en preguntas frecuentes' }).fill('contraseña');
  const pregunta = page.getByRole('button', { name: /Olvidé mi contraseña/ });
  await expect(pregunta).toHaveCount(1);
  await expect(pregunta).toHaveAttribute('aria-expanded', 'false');
  await pregunta.click();
  await expect(pregunta).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator(`#${await pregunta.getAttribute('aria-controls')}`)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Llamar' })).toHaveAttribute('href', /^tel:\+57/);
});

test('habla con nosotros: el botón abre WhatsApp y la ruta vieja redirige', async ({ page }) => {
  await page.goto('/#/habla-con-nosostros');
  await expect(page).toHaveURL(/#\/habla-con-nosotros$/);
  await expect(page.getByRole('link', { name: 'Escribir por WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/57/);
});

test('nueva PQR: enviar vacío muestra el error debajo de cada campo y lleva el foco al primero', async ({ page }) => {
  await conSesion(page);
  await page.goto('/#/nuevo-pqr');
  await page.getByRole('button', { name: 'Enviar PQR' }).click();

  const asunto = page.getByRole('textbox', { name: 'Asunto:' });
  await expect(asunto).toBeFocused();
  await expect(asunto).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#asunto-error')).toBeVisible();
  await expect(page.locator('#descripcion-error')).toBeVisible();

  await asunto.fill('Cobro repetido');
  await expect(page.locator('#asunto-error')).toHaveCount(0);
  await sinGraves(page);
});

test('nueva PQR: el adjunto se puede elegir con el teclado', async ({ page }) => {
  await conSesion(page);
  await page.goto('/#/nuevo-pqr');
  const archivo = page.locator('#archivo');
  await archivo.focus();
  await expect(archivo).toBeFocused();
});

test('detalle de PQR: muestra radicado, estado, adjunto y conversación del MID', async ({ page }) => {
  await conSesion(page);
  await page.goto(`/#/ver-pqr/${DETALLE_PQR.radicado}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(DETALLE_PQR.titulo);
  await expect(page.locator('.banda-cifras')).toContainText(DETALLE_PQR.radicado);
  await expect(page.locator('.estado-badge')).toHaveText('En revisión');
  await expect(page.getByText('extracto.pdf · 2 KB')).toBeVisible();
  await expect(page.getByText('¿Nos compartes el comprobante?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar mensaje' })).toBeDisabled();
});
