import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlianzasComponent } from './alianzas';

describe('Alianzas', () => {
  let component: AlianzasComponent;
  let fixture: ComponentFixture<AlianzasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlianzasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AlianzasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar las ofertas mock', () => {
    expect(component.ofertas.length).toBe(3);
  });

  it('debe seleccionar un tipo de aliado al hacer click', () => {
    component.seleccionarTipoAliado('Fintech');
    expect(component.tipoAliadoSeleccionado()).toBe('Fintech');
  });

  it('debe alternar (toggle) un filtro de beneficio', () => {
    component.seleccionarBeneficio('Cashback');
    expect(component.beneficioSeleccionado()).toBe('Cashback');

    component.seleccionarBeneficio('Cashback');
    expect(component.beneficioSeleccionado()).toBeNull();
  });

  it('debe recalcular el pago mensual al cambiar el plazo', () => {
    component.seleccionarPlazo(12);
    const pago12 = component.pagoMensual();

    component.seleccionarPlazo(48);
    const pago48 = component.pagoMensual();

    expect(pago12).toBeGreaterThan(pago48);
  });

  it('debe formatear valores en pesos colombianos', () => {
    const formato = component.formatCOP(15000000);
    expect(formato).toContain('15.000.000');
  });
});
