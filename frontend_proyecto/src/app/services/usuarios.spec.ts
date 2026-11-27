import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_URL } from './api';
import { UsuarioLista, UsuariosService } from './usuarios';

// Así responde el MID GET /v1/admin/usuarios
const USUARIO_MID = {
  id_usuario: 6,
  nombre: 'Ana',
  apellido: 'Gómez',
  email: 'ana@financeup.test',
  telefono: '3001234567',
  cedula: '1010101010',
  estado: 'activo',
  activo: true,
  rol: 'user',
  roles: ['Usuario'],
  fecha_registro: '2026-11-20T14:21:23Z',
  ultima_sesion: null,
};

describe('UsuariosService', () => {
  let service: UsuariosService;
  let http: HttpTestingController;
  let ana: UsuarioLista;

  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem(
      'financeup_user',
      JSON.stringify({ id: 8, email: 'admin@financeup.test', nombre: 'Admin', rol: 'admin', token: 'abc' })
    );
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UsuariosService);
    http = TestBed.inject(HttpTestingController);

    service.cargar();
    http.expectOne(`${API_URL}/admin/usuarios`).flush([
      USUARIO_MID,
      { ...USUARIO_MID, id_usuario: 7, email: 'luis@financeup.test', cedula: '', estado: 'inactivo', rol: 'admin' },
      { ...USUARIO_MID, id_usuario: 9, email: 'eva@financeup.test', estado: 'suspendido', ultima_sesion: '2026-11-24T10:00:00Z' },
    ]);
    ana = service.listar()[0];
  });

  afterEach(() => http.verify());

  it('carga los usuarios del MID con documento, fechas y estado de pantalla', () => {
    expect(service.listar()).toHaveLength(3);
    expect(ana).toMatchObject({ id: 6, documento: '1010101010', fechaRegistro: '2026-11-20T14:21:23Z', ultimoAcceso: null });
    expect(service.listar()[1].estado).toBe('bloqueado');
    expect(service.listar()[1].documento).toBeUndefined();
    expect(service.listar()[2].estado).toBe('suspendido');
    expect(service.cargando()).toBe(false);
  });

  it('si el MID falla deja el mensaje de error', () => {
    service.cargar();
    http.expectOne(`${API_URL}/admin/usuarios`).flush({ error: 'Solo un administrador' }, { status: 403, statusText: 'Forbidden' });

    expect(service.error()).toBe('Solo un administrador');
    expect(service.cargando()).toBe(false);
  });

  it('crear manda los nombres del MID, recarga la lista y lo anota en la bitácora', () => {
    service
      .crear({ nombre: 'Carla', apellido: 'Ríos', email: 'carla@financeup.test', password: 'Prueba2026x', rol: 'admin', telefono: '300', documento: '' })
      .subscribe();

    const peticion = http.expectOne(`${API_URL}/admin/usuarios`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      nombre: 'Carla',
      apellido: 'Ríos',
      email: 'carla@financeup.test',
      contrasena: 'Prueba2026x',
      rol: 'admin',
      telefono: '300',
      cedula: '',
    });
    peticion.flush({ id_usuario: 10, mensaje: 'Usuario creado', rol: 'admin' });

    http.expectOne({ method: 'GET', url: `${API_URL}/admin/usuarios` }).flush([]);
    expect(service.bitacora()[0]).toMatchObject({ email: 'carla@financeup.test', accion: 'creacion', admin: 'admin@financeup.test' });
  });

  it('editar solo manda los datos personales', () => {
    service.editar(ana, { nombre: 'Ana', apellido: 'Gómez', telefono: '311', documento: '999' }).subscribe();

    const peticion = http.expectOne(`${API_URL}/admin/usuarios/6`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({ nombre: 'Ana', apellido: 'Gómez', telefono: '311', cedula: '999' });
    peticion.flush({ mensaje: 'Usuario actualizado' });
    http.expectOne(`${API_URL}/admin/usuarios`).flush([]);
  });

  it('cambiar rol usa la ruta del rol', () => {
    service.cambiarRol(ana, 'admin').subscribe();

    const peticion = http.expectOne(`${API_URL}/admin/usuarios/6/rol`);
    expect(peticion.request.body).toEqual({ rol: 'admin' });
    peticion.flush({ rol: 'admin' });
    http.expectOne(`${API_URL}/admin/usuarios`).flush([]);
    expect(service.actividadDe('ana@financeup.test')[0].accion).toBe('cambio-rol');
  });

  it('bloquear deja la cuenta inactiva con motivo y desbloquear la activa', () => {
    service.bloquear(ana, 'Actividad sospechosa').subscribe();
    const bloqueo = http.expectOne(`${API_URL}/admin/usuarios/6/estado`);
    expect(bloqueo.request.body).toEqual({ estado: 'inactivo', motivo: 'Actividad sospechosa' });
    bloqueo.flush({ estado: 'inactivo' });
    http.expectOne(`${API_URL}/admin/usuarios`).flush([]);

    service.desbloquear(ana).subscribe();
    const desbloqueo = http.expectOne(`${API_URL}/admin/usuarios/6/estado`);
    expect(desbloqueo.request.body).toEqual({ estado: 'activo', motivo: '' });
    desbloqueo.flush({ estado: 'activo' });
    http.expectOne(`${API_URL}/admin/usuarios`).flush([]);

    expect(service.actividadDe('ana@financeup.test').map((r) => r.accion)).toEqual(['bloqueo', 'desbloqueo']);
  });

  it('restablecer contraseña le manda el código de recuperación al usuario', () => {
    service.restablecerPassword(ana).subscribe();

    const peticion = http.expectOne(`${API_URL}/recuperar-contrasena`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ email: 'ana@financeup.test' });
    peticion.flush({ mensaje: 'Codigo enviado' });
    expect(service.actividadDe('ana@financeup.test')[0].accion).toBe('restablecimiento');
  });

  it('si el MID rechaza la acción no anota nada en la bitácora', () => {
    let error = '';
    service.cambiarRol(ana, 'admin').subscribe({ error: (e) => (error = e.error.error) });
    http
      .expectOne(`${API_URL}/admin/usuarios/6/rol`)
      .flush({ error: 'No puedes cambiar tu propio rol' }, { status: 400, statusText: 'Bad Request' });

    expect(error).toBe('No puedes cambiar tu propio rol');
    expect(service.bitacora()).toEqual([]);
  });
});
