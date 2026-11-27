import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VERSION_POLITICA } from '../shared/utils/politica';

import { AuthService } from './auth';
import { API_URL, mensajeDeError } from './api';

// Respuesta del MID cuando la sesión queda iniciada (verificar código o registro)
const SESION_MID = {
  mensaje: 'Inicio de sesion exitoso',
  token: 'token-de-prueba',
  expira_en: 3600,
  id_usuario: 7,
  nombre: 'Ana',
  apellido: 'Gómez',
  email: 'ana@correo.com',
  rol: 'user',
  estado: 'activo',
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('el paso 1 del login manda correo y contraseña al MID', () => {
    let tokenVerificacion = '';
    service
      .iniciarSesion('ana@correo.com', 'Clave1234')
      .subscribe((r) => (tokenVerificacion = r.tipo === 'codigo' ? r.tokenVerificacion : ''));

    const peticion = http.expectOne(`${API_URL}/login`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ email: 'ana@correo.com', contrasena: 'Clave1234' });
    peticion.flush({ mensaje: 'Te enviamos un codigo', requiere_codigo: true, token_verificacion: 'tv-1' });

    expect(tokenVerificacion).toBe('tv-1');
    expect(service.estaAutenticado()).toBe(false);
  });

  it('el administrador entra sin código: el paso 1 ya deja la sesión iniciada', () => {
    let tipo = '';
    service.iniciarSesion('admin@financeup.com', 'Admin1234').subscribe((r) => (tipo = r.tipo));

    http
      .expectOne(`${API_URL}/login`)
      .flush({ ...SESION_MID, rol: 'admin', requiere_codigo: false, debe_aceptar_politica: false });

    expect(tipo).toBe('sesion');
    const usuario = service.obtenerUsuario()!;
    expect(usuario.rol).toBe('admin');
    expect(service.rutaDeInicio(usuario)).toBe('/admin');
  });

  it('el usuario que no ha aceptado la política va a aceptarla y luego sigue a la app', () => {
    service.verificarCodigo('tv-1', '123456').subscribe();
    http.expectOne(`${API_URL}/login/verificar`).flush({ ...SESION_MID, debe_aceptar_politica: true });

    expect(service.rutaDeInicio(service.obtenerUsuario()!)).toBe('/aceptar-politica');

    service.aceptarPolitica().subscribe();
    const peticion = http.expectOne(`${API_URL}/perfil/7/politica`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({ acepta_terminos: true, version_politica: VERSION_POLITICA });
    peticion.flush({ id_usuario: 7, version_politica: VERSION_POLITICA });

    expect(service.obtenerUsuario()?.debeAceptarPolitica).toBe(false);
    expect(service.rutaDeInicio(service.obtenerUsuario()!)).toBe('/home');
    expect(JSON.parse(sessionStorage.getItem('financeup_user')!).debeAceptarPolitica).toBe(false);
  });

  it('al verificar el código guarda la sesión con el token del MID', () => {
    service.verificarCodigo('tv-1', '123456').subscribe();

    const peticion = http.expectOne(`${API_URL}/login/verificar`);
    expect(peticion.request.body).toEqual({ token_verificacion: 'tv-1', codigo: '123456' });
    peticion.flush(SESION_MID);

    const usuario = service.obtenerUsuario();
    expect(usuario?.id).toBe(7);
    expect(usuario?.token).toBe('token-de-prueba');
    expect(usuario?.rol).toBe('user');
    expect(JSON.parse(sessionStorage.getItem('financeup_user')!).token).toBe('token-de-prueba');
  });

  it('el registro manda los datos con los nombres del MID y deja la sesión iniciada', () => {
    service
      .registrar({
        nombre: 'Ana',
        apellido: 'Gómez',
        email: 'ana@correo.com',
        contrasena: 'Clave1234',
        fecha_nacimiento: '1998-04-12',
      })
      .subscribe();

    const peticion = http.expectOne(`${API_URL}/registro`);
    expect(peticion.request.body).toEqual({
      nombre: 'Ana',
      apellido: 'Gómez',
      email: 'ana@correo.com',
      contrasena: 'Clave1234',
      fecha_nacimiento: '1998-04-12',
      acepta_terminos: true,
      // Prueba de qué texto aceptó: la versión vigente de la política
      version_politica: VERSION_POLITICA,
    });
    peticion.flush({ ...SESION_MID, mensaje: 'Usuario registrado' });

    expect(service.obtenerUsuario()?.nombre).toBe('Ana');
  });

  describe('perfil (con sesión iniciada)', () => {
    const PERFIL_MID = {
      id_usuario: 7,
      nombre: 'Ana',
      apellido: 'Gómez',
      email: 'ana@correo.com',
      tipo_documento: '',
      cedula: '',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      direccion: 'Calle 1',
      fecha_nacimiento: '2000-05-14',
      estado: 'activo',
      rol: 'user',
    };

    beforeEach(() => {
      service.verificarCodigo('tv-1', '123456').subscribe();
      http.expectOne(`${API_URL}/login/verificar`).flush(SESION_MID);
    });

    it('trae el perfil del usuario de la sesión', () => {
      let perfil: unknown;
      service.obtenerPerfil().subscribe((p) => (perfil = p));

      const peticion = http.expectOne(`${API_URL}/perfil/7`);
      expect(peticion.request.method).toBe('GET');
      peticion.flush(PERFIL_MID);

      expect(perfil).toEqual(PERFIL_MID);
    });

    it('guarda los datos personales y actualiza el nombre de la sesión', () => {
      const datos = {
        nombre: 'Ana María',
        apellido: 'Gómez',
        telefono: '3001234567',
        ciudad: 'Bogotá',
        direccion: 'Calle 1',
        fecha_nacimiento: '2000-05-14',
      };
      service.actualizarPerfil(datos).subscribe();

      const peticion = http.expectOne(`${API_URL}/perfil/7`);
      expect(peticion.request.method).toBe('PUT');
      expect(peticion.request.body).toEqual(datos);
      peticion.flush({ ...PERFIL_MID, nombre: 'Ana María' });

      expect(service.obtenerUsuario()?.nombre).toBe('Ana María');
      expect(JSON.parse(sessionStorage.getItem('financeup_user')!).nombre).toBe('Ana María');
    });

    it('cambia la contraseña con los nombres que espera el MID', () => {
      service.cambiarContrasena('Vieja1234', 'Nueva1234').subscribe();

      const peticion = http.expectOne(`${API_URL}/perfil/7/contrasena`);
      expect(peticion.request.method).toBe('PUT');
      expect(peticion.request.body).toEqual({ contrasena_actual: 'Vieja1234', contrasena_nueva: 'Nueva1234' });
      peticion.flush({ mensaje: 'Contrasena actualizada' });
    });
  });

  it('recuperar contraseña: pide el código y luego guarda la clave nueva', () => {
    service.pedirCodigoRecuperacion('ana@correo.com').subscribe();
    const pedir = http.expectOne(`${API_URL}/recuperar-contrasena`);
    expect(pedir.request.method).toBe('POST');
    expect(pedir.request.body).toEqual({ email: 'ana@correo.com' });
    pedir.flush({ mensaje: 'Si el correo esta registrado, te enviamos un codigo' });

    service.restablecerContrasena('ana@correo.com', '654321', 'Nueva1234').subscribe();
    const guardar = http.expectOne(`${API_URL}/recuperar-contrasena`);
    expect(guardar.request.method).toBe('PUT');
    expect(guardar.request.body).toEqual({ email: 'ana@correo.com', codigo: '654321', contrasena_nueva: 'Nueva1234' });
    guardar.flush({ mensaje: 'Contrasena actualizada' });
  });

  it('cerrar sesión avisa al MID y borra la sesión local', () => {
    service.verificarCodigo('tv-1', '123456').subscribe();
    http.expectOne(`${API_URL}/login/verificar`).flush(SESION_MID);

    service.cerrarSesion();

    http.expectOne(`${API_URL}/logout`).flush({ mensaje: 'Sesion cerrada' });
    expect(service.estaAutenticado()).toBe(false);
    expect(sessionStorage.getItem('financeup_user')).toBeNull();
  });
});

describe('mensajeDeError', () => {
  it('usa el texto de error que manda el MID', () => {
    const error = new HttpErrorResponse({ status: 401, error: { error: 'Correo o contrasena incorrectos' } });
    expect(mensajeDeError(error)).toBe('Correo o contrasena incorrectos');
  });

  it('avisa cuando el MID no responde', () => {
    const error = new HttpErrorResponse({ status: 0 });
    expect(mensajeDeError(error)).toContain('No hay conexión con el servidor');
  });
});
