import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioMovimientoComponent, DatosMovimiento } from './formulario-movimiento';
import { Movimiento } from '../../../../services/finanzas';

describe('FormularioMovimientoComponent', () => {
  let fixture: ComponentFixture<FormularioMovimientoComponent>;
  let raiz: HTMLElement;
  let guardados: DatosMovimiento[];

  async function crear(movimiento?: Movimiento): Promise<void> {
    await TestBed.configureTestingModule({ imports: [FormularioMovimientoComponent] }).compileComponents();
    fixture = TestBed.createComponent(FormularioMovimientoComponent);
    if (movimiento) fixture.componentRef.setInput('movimiento', movimiento);
    guardados = [];
    fixture.componentInstance.guardar.subscribe((d) => guardados.push(d));
    raiz = fixture.nativeElement;
    await fixture.whenStable();
  }

  function campo<T extends HTMLElement>(selector: string): T {
    const el = raiz.querySelector<T>(selector);
    if (!el) throw new Error(`No existe ${selector}`);
    return el;
  }

  async function escribir(selector: string, valor: string): Promise<void> {
    const el = campo<HTMLInputElement>(selector);
    el.value = valor;
    el.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function enviar(): Promise<void> {
    campo<HTMLButtonElement>('button[type="submit"]').click();
    await fixture.whenStable();
  }

  it('no guarda y explica qué falta si el concepto y el valor están vacíos', async () => {
    await crear();
    await enviar();

    expect(guardados).toEqual([]);
    expect(campo('#mov-concepto').getAttribute('aria-invalid')).toBe('true');
    expect(campo('#mov-valor').getAttribute('aria-invalid')).toBe('true');
    expect(raiz.textContent).toContain('Escribe en qué se fue o de dónde vino el dinero');
    expect(raiz.textContent).toContain('Escribe un valor mayor a $ 0');
  });

  it('guarda un gasto con el valor en pesos sin separadores', async () => {
    await crear();
    await escribir('#mov-valor', '45000');
    await escribir('#mov-concepto', '  Mercado de la semana ');
    await escribir('#mov-fecha', '2026-11-20');
    await enviar();

    expect(guardados.length).toBe(1);
    expect(guardados[0]).toEqual(
      expect.objectContaining({
        tipo: 'gasto',
        valor: 45000,
        concepto: 'Mercado de la semana',
        fecha: '2026-11-20',
      }),
    );
  });

  it('muestra el valor con puntos de miles mientras se escribe', async () => {
    await crear();
    await escribir('#mov-valor', '1850000');

    expect(campo<HTMLInputElement>('#mov-valor').value).toBe('1.850.000');
  });

  it('al cambiar a ingreso solo ofrece categorías de ingreso', async () => {
    await crear();
    campo<HTMLInputElement>('input[type="radio"][value="ingreso"]').click();
    await fixture.whenStable();

    const opciones = Array.from(campo<HTMLSelectElement>('#mov-categoria').options).map((o) => o.value);
    expect(opciones).toEqual(['Salario', 'Otros ingresos']);
    expect(campo<HTMLSelectElement>('#mov-categoria').value).toBe('Salario');
  });

  it('en edición carga el movimiento y conserva una categoría que no está en la lista', async () => {
    await crear({
      id: 7,
      fecha: '2026-11-02',
      concepto: 'Arriendo',
      categoria: 'Parqueadero',
      tipo: 'gasto',
      valor: 1200000,
      metodoPago: 'Transferencia',
    });

    expect(campo<HTMLInputElement>('#mov-concepto').value).toBe('Arriendo');
    expect(campo<HTMLInputElement>('#mov-valor').value).toBe('1.200.000');
    expect(campo<HTMLSelectElement>('#mov-categoria').value).toBe('Parqueadero');
    expect(campo('button[type="submit"]').textContent).toContain('Guardar cambios');
  });
});
