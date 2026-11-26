import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { API_URL } from './api';
import { NotificacionesService } from './notificaciones';
import { PqrService } from './pqr';

// Así responde el MID GET /v1/pqr/usuario/:id
const PQR_MID = {
  id_pqr: 4,
  radicado: 'PQR-20261125-101500',
  titulo: 'Cobro duplicado',
  tipo: 'reclamo',
  categoria: 'Movimientos y pagos',
  prioridad: 'alta',
  estado: 'En Revision',
  progreso: 50,
  descripcion: 'Me cobraron dos veces',
  asesor: 'Admin',
  fecha_creacion: '2026-11-20T14:21:23.112789Z',
  ultima_actualizacion: '2026-11-25T09:00:00Z',
};

describe('PqrService', () => {
  let service: PqrService;
  let http: HttpTestingController;

  function crear(conSesion: boolean): void {
    sessionStorage.clear();
    localStorage.clear();
    if (conSesion) {
      sessionStorage.setItem(
        'financeup_user',
        JSON.stringify({ id: 6, email: 'a@b.co', nombre: 'Ana', rol: 'user', token: 'abc' })
      );
    }
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PqrService);
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  it('carga las PQR del usuario de la sesión y traduce tipo, prioridad, estado y fechas', () => {
    crear(true);
    service.cargarMisPqr();
    http.expectOne(`${API_URL}/pqr/usuario/6`).flush([PQR_MID]);

    const pqr = service.misPqr()[0];
    expect(pqr.id).toBe(4);
    expect(pqr.tipo).toBe('Reclamo');
    expect(pqr.prioridad).toBe('Alta');
    expect(pqr.estado).toBe('En revisión');
    expect(pqr.fechaCreacion).toBe('20 nov 2026');
    expect(pqr.ultimaActualizacion).toBe('25 nov 2026');
    expect(service.cargando()).toBe(false);
  });

  it('sin sesión no pide nada y deja la lista vacía', () => {
    crear(false);
    service.cargarMisPqr();

    http.expectNone(() => true);
    expect(service.misPqr()).toEqual([]);
  });

  it('si el MID falla deja el mensaje de error', () => {
    crear(true);
    service.cargarMisPqr();
    http
      .expectOne(`${API_URL}/pqr/usuario/6`)
      .flush({ error: 'El CRUD no responde' }, { status: 502, statusText: 'Bad Gateway' });

    expect(service.error()).toBe('El CRUD no responde');
    expect(service.cargando()).toBe(false);
  });

  it('radicar manda los códigos que espera el MID y avisa al admin', () => {
    crear(true);
    const notificaciones = TestBed.inject(NotificacionesService);
    const total = notificaciones.notificaciones().length;
    let radicado = '';

    service
      .radicarPqr({
        titulo: 'Cobro duplicado',
        tipo: 'Reclamo',
        categoria: 'Movimientos y pagos',
        prioridad: 'Alta',
        descripcion: 'Me cobraron dos veces',
        adjunto: new File(['abc'], 'recibo.pdf', { type: 'application/pdf' }),
      })
      .subscribe((r) => (radicado = r.radicado));

    const peticion = http.expectOne(`${API_URL}/pqr`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      id_usuario: 6,
      titulo: 'Cobro duplicado',
      tipo: 'reclamo',
      categoria: 'Movimientos y pagos',
      prioridad: 'alta',
      descripcion: 'Me cobraron dos veces',
      adjuntos: [{ nombre_archivo: 'recibo.pdf', ruta_archivo: '', tipo_mime: 'application/pdf', tamano_bytes: 3 }],
    });
    peticion.flush({ id_pqr: 9, radicado: 'PQR-20261125-120000', estado: 'Abierta' });

    expect(radicado).toBe('PQR-20261125-120000');
    expect(notificaciones.notificaciones()).toHaveLength(total + 1);
    expect(notificaciones.notificaciones()[0].categoria).toBe('pqr');
  });

  it('el detalle trae la conversación y los adjuntos', () => {
    crear(true);
    let detalle: any;
    service.verPqr('PQR-20261125-101500').subscribe((d) => (detalle = d));
    http.expectOne(`${API_URL}/pqr/radicado/PQR-20261125-101500`).flush({
      ...PQR_MID,
      mensaje_respuesta: 'Ya revisamos tu caso',
      respuestas: [{ autor: 'Admin', mensaje: 'Ya revisamos tu caso', fecha: '2026-11-24T10:00:00Z' }],
      adjuntos: [{ nombre: 'recibo.pdf', ruta: '', tipo: 'application/pdf', tamano: 2048 }],
    });

    expect(detalle.estado).toBe('En revisión');
    expect(detalle.mensajeRespuesta).toBe('Ya revisamos tu caso');
    expect(detalle.respuestas[0]).toEqual({ autor: 'Admin', mensaje: 'Ya revisamos tu caso', fecha: '24 nov 2026' });
    expect(detalle.adjuntos[0]).toEqual({ nombre: 'recibo.pdf', tipo: 'application/pdf', tamano: 2048 });
  });

  it('el usuario contesta en su PQR por la ruta del dueño', () => {
    crear(true);
    service.responder(4, 'Adjunto el recibo').subscribe();

    const peticion = http.expectOne(`${API_URL}/pqr/4/respuesta`);
    expect(peticion.request.body).toEqual({ mensaje: 'Adjunto el recibo' });
    peticion.flush({ mensaje: 'Respuesta guardada' });
  });

  it('el admin responde y cambia el estado con el nombre y el progreso de la base', () => {
    crear(true);
    service.responderComoAdmin(4, 'Caso resuelto', 'Resuelta').subscribe();

    const peticion = http.expectOne(`${API_URL}/admin/pqr/4/respuesta`);
    expect(peticion.request.body).toEqual({ mensaje: 'Caso resuelto', estado: 'Resuelta', progreso: 100 });
    peticion.flush({ mensaje: 'Respuesta guardada' });

    service.responderComoAdmin(4, 'Lo estamos revisando', 'En revisión').subscribe();
    const otra = http.expectOne(`${API_URL}/admin/pqr/4/respuesta`);
    expect(otra.request.body).toEqual({ mensaje: 'Lo estamos revisando', estado: 'En Revision', progreso: 50 });
    otra.flush({ mensaje: 'Respuesta guardada' });
  });

  it('carga las PQR del admin con el nombre del solicitante', () => {
    crear(true);
    service.cargarPqrAdmin();
    http.expectOne(`${API_URL}/admin/pqr`).flush([{ ...PQR_MID, usuario: 'Ana Gómez', estado: 'Abierta' }]);

    const pqr = service.pqrsAdmin()[0];
    expect(pqr.usuario).toBe('Ana Gómez');
    expect(pqr.estado).toBe('Abierta');
  });
});
