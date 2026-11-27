import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_URL } from './api';
import { FinanzasAdminService } from './finanzas-admin';

describe('FinanzasAdminService', () => {
  let service: FinanzasAdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FinanzasAdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('trae movimientos, metas e inversiones de todos los usuarios', () => {
    service.cargar();
    expect(service.cargando()).toBe(true);

    http.expectOne(`${API_URL}/admin/finanzas`).flush({
      movimientos: [{ id: 8, usuario: 'Ana', fecha: '2026-11-23', concepto: 'Café', categoria: 'Gastos hormiga', tipo: 'gasto', valor: 60000 }],
      metas: null,
      inversiones: [{ id: 1, usuario: 'Ana', nombre: 'Acciones', monto: 1000000, rendimiento: 125000 }],
    });

    expect(service.cargando()).toBe(false);
    expect(service.movimientos()[0].categoria).toBe('Gastos hormiga');
    expect(service.metas()).toEqual([]);
    expect(service.inversiones().length).toBe(1);
  });

  it('si el MID falla deja el mensaje de error', () => {
    service.cargar();
    http.expectOne(`${API_URL}/admin/finanzas`).flush({ error: 'No autorizado' }, { status: 403, statusText: 'Forbidden' });

    expect(service.cargando()).toBe(false);
    expect(service.error()).not.toBe('');
  });
});
