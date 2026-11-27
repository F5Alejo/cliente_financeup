import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RegisterComponent } from './register';
import { EDAD_MINIMA, fechaMaximaNacimiento } from '../../../shared/utils/politica';

describe('Register', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      // RouterLink necesita el router; '**' absorbe navegaciones como /login.
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('acepta la misma contraseña que el MID: 8+ caracteres, una mayúscula y un número (sin exigir minúscula)', () => {
    component.password?.setValue('CLAVE1234');
    expect(component.password?.valid).toBe(true);
    component.password?.setValue('clave1234');
    expect(component.password?.valid).toBe(false);
  });

  it('la fecha de nacimiento exige mayoría de edad', () => {
    const fecha = component.fechaNacimiento!;
    fecha.setValue('');
    expect(fecha.hasError('required')).toBe(true);

    // Cumple 18 justo hoy: sí puede registrarse
    fecha.setValue(fechaMaximaNacimiento());
    expect(fecha.valid).toBe(true);

    // Le falta un día: nació un día después de la fecha límite
    const hoy = new Date();
    const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
    fecha.setValue(fechaMaximaNacimiento(manana));
    expect(fecha.hasError('menorDeEdad')).toBe(true);
    expect(component.errorFecha).toContain(`mayores de ${EDAD_MINIMA}`);

    fecha.setValue('1890-05-01');
    expect(fecha.hasError('fechaInvalida')).toBe(true);
  });

  it('marca la confirmación cuando no coincide', () => {
    component.password?.setValue('Clave1234');
    component.confirmarPassword?.setValue('Clave12345');
    component.confirmarPassword?.markAsTouched();
    expect(component.confirmacionConError()).toBe(true);
  });
});
