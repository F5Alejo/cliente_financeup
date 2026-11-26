import { TestBed } from '@angular/core/testing';

import { NotificacionesService } from './notificaciones';
import { PreferenciasAdminService } from './preferencias-admin';

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
});
