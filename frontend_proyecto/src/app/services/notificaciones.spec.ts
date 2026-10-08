import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth';
import { NotificacionesService } from './notificaciones';
import { PreferenciasAdminService } from './preferencias-admin';
import { PqrService } from './pqr';

describe('NotificacionesService', () => {
  let service: NotificacionesService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificacionesService);
  });

  it('cuenta las notificaciones sin leer y las marca una por una', () => {
    const antes = service.sinLeer();
    const primera = service.notificaciones().find((n) => !n.leida)!;

    service.marcarLeida(primera.id);

    expect(antes).toBeGreaterThan(0);
    expect(service.sinLeer()).toBe(antes - 1);
  });

  it('marca todas como leídas', () => {
    service.marcarTodasLeidas();

    expect(service.sinLeer()).toBe(0);
    expect(service.notificaciones().every((n) => n.leida)).toBe(true);
  });

  it('agrega notificaciones nuevas al inicio y sin leer', () => {
    service.agregar({ categoria: 'pqr', titulo: 'Prueba', detalle: 'Detalle', ruta: '/admin/pqr', nivel: 'info' });

    expect(service.notificaciones()[0]).toMatchObject({ titulo: 'Prueba', leida: false });
  });

  it('ignora las categorías que el administrador desactivó', () => {
    const preferencias = TestBed.inject(PreferenciasAdminService);
    preferencias.actualizar({ notificaciones: { ...preferencias.prefs().notificaciones, pqr: false } });
    const total = service.notificaciones().length;

    service.agregar({ categoria: 'pqr', titulo: 'Silenciada', detalle: '', ruta: '/admin/pqr', nivel: 'info' });

    expect(service.notificaciones()).toHaveLength(total);
  });

  it('se crea una notificación cuando un usuario se registra o envía una PQR', () => {
    const total = service.notificaciones().length;

    TestBed.inject(AuthService).registrarUsuario('Nora', 'Díaz', 'nora@gmail.com', 'Segura123');
    TestBed.inject(PqrService).agregarPqr({
      titulo: 'Consulta', numero: '999', estado: 'Radicado', tipo: 'Petición', categoria: 'General', descripcion: '',
      prioridad: 'Baja', fechaCreacion: '', ultimaActualizacion: '', asesor: '', respuestas: 0, adjuntos: 0, progreso: 0,
      usuario: 'Nora', archivosAdjuntos: [], mensajeRespuesta: '',
    });

    expect(service.notificaciones()).toHaveLength(total + 2);
    expect(service.notificaciones().map((n) => n.categoria).slice(0, 2)).toEqual(['pqr', 'usuarios']);
  });
});
