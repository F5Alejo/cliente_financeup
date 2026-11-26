import { TestBed } from '@angular/core/testing';

import { LogoComponent } from './logo';

function crear(entradas: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(LogoComponent);
  for (const [nombre, valor] of Object.entries(entradas)) fixture.componentRef.setInput(nombre, valor);
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  return { host, svg: host.querySelector('svg') as SVGSVGElement };
}

describe('LogoComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [LogoComponent] }));

  it('por defecto pinta el logo horizontal a color con nombre accesible', () => {
    const { host, svg } = crear();
    expect(host.dataset['tono']).toBe('color');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('FinanceUp');
    expect(svg.querySelector('.logo__fin')).not.toBeNull();
    expect(svg.querySelector('.logo__flecha')).not.toBeNull();
  });

  it('el isotipo no lleva letras', () => {
    const { svg } = crear({ variante: 'isotipo' });
    expect(svg.querySelector('.logo__fin')).toBeNull();
    expect(svg.querySelectorAll('.logo__barra').length).toBe(2);
  });

  it('la palabra no lleva isotipo', () => {
    const { svg } = crear({ variante: 'palabra' });
    expect(svg.querySelector('.logo__flecha')).toBeNull();
    expect(svg.querySelector('.logo__up')).not.toBeNull();
  });

  it('decorativo se oculta a lectores de pantalla', () => {
    const { svg } = crear({ decorativo: true });
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('role')).toBeNull();
    expect(svg.getAttribute('aria-label')).toBeNull();
  });

  it('cambia de viewBox con la variante', () => {
    const horizontal = crear().svg.getAttribute('viewBox');
    const apilado = crear({ variante: 'apilado' }).svg.getAttribute('viewBox');
    expect(horizontal).not.toBe(apilado);
  });

  it('expone el tono para los estilos', () => {
    expect(crear({ tono: 'claro' }).host.dataset['tono']).toBe('claro');
  });
});
