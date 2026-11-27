import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PoliticaDatosComponent } from './politica-datos';

describe('PoliticaDatosComponent', () => {
  let fixture: ComponentFixture<PoliticaDatosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoliticaDatosComponent],
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(PoliticaDatosComponent);
    await fixture.whenStable();
  });

  it('cada entrada del índice apunta a una sección que existe', () => {
    const html: HTMLElement = fixture.nativeElement;
    for (const seccion of fixture.componentInstance.indice) {
      expect(html.querySelector(`section#${seccion.id}`)).not.toBeNull();
    }
  });

  it('muestra los plazos de la ley para consultas y reclamos', () => {
    const texto = (fixture.nativeElement as HTMLElement).querySelector('#ejercer')?.textContent ?? '';
    expect(texto).toContain('10 días hábiles');
    expect(texto).toContain('15 días hábiles');
  });
});
