import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { RecuperarContrasena } from './recuperar-contrasena';
import { API_URL } from '../../../services/api';

describe('RecuperarContrasena', () => {
  let component: RecuperarContrasena;
  let fixture: ComponentFixture<RecuperarContrasena>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuperarContrasena],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RecuperarContrasena);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('pide el código al MID y pasa al paso del código', () => {
    component.email = 'ana@correo.com';
    component.enviarCodigo();

    http.expectOne(`${API_URL}/recuperar-contrasena`).flush({ mensaje: 'ok' });
    expect(component.paso()).toBe('codigo');
  });

  it('con el código y la clave nueva guarda y muestra la confirmación', () => {
    component.email = 'ana@correo.com';
    component.paso.set('codigo');
    component.codigo = '654321';
    component.nuevaPassword = 'Nueva1234';
    component.confirmarPassword = 'Nueva1234';
    component.onPasswordInput();
    component.guardarPassword();

    const peticion = http.expectOne(`${API_URL}/recuperar-contrasena`);
    expect(peticion.request.body).toEqual({ email: 'ana@correo.com', codigo: '654321', contrasena_nueva: 'Nueva1234' });
    peticion.flush({ mensaje: 'Contrasena actualizada' });
    expect(component.paso()).toBe('listo');
  });

  it('si el código está mal muestra el error del MID y se queda en el paso', () => {
    component.email = 'ana@correo.com';
    component.paso.set('codigo');
    component.codigo = '000000';
    component.nuevaPassword = 'Nueva1234';
    component.confirmarPassword = 'Nueva1234';
    component.onPasswordInput();
    component.guardarPassword();

    http
      .expectOne(`${API_URL}/recuperar-contrasena`)
      .flush({ error: 'El codigo no es correcto' }, { status: 401, statusText: 'Unauthorized' });
    expect(component.errorMessage()).toBe('El codigo no es correcto');
    expect(component.paso()).toBe('codigo');
  });
});
