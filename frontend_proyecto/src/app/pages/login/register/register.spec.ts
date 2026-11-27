import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RegisterComponent } from './register';

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

  it('marca la confirmación cuando no coincide', () => {
    component.password?.setValue('Clave1234');
    component.confirmarPassword?.setValue('Clave12345');
    component.confirmarPassword?.markAsTouched();
    expect(component.confirmacionConError()).toBe(true);
  });
});
