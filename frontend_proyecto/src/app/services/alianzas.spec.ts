import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AlianzasService } from './alianzas';
import { API_URL } from './api';

// Así responde el MID GET /v1/ofertas
const OFERTA_MID = {
  id: 6,
  slug: 'fintech-luz',
  aliado: 'Fintech Luz',
  tipo: 'fintech',
  logo_texto: 'FL',
  logo_fondo: 'linear-gradient(135deg, #1db954 0%, #0a5c28 100%)',
  categoria: 'Tarjeta de crédito digital',
  descripcion: 'Tarjeta con cashback',
  promesa: 'Cashback en lo que compras',
  meta: 'Recomendada · ID 2288',
  familia: 'tarjetas',
  beneficio: 'cashback',
  tasa_desde: 18.5,
  monto_maximo: 12000000,
  plazo_maximo: 36,
  aprobacion: '10 minutos',
  calificacion: 4.6,
  usuarios: 8450,
  compatibilidad: 87,
  destacada: true,
  cta_primaria: 'Solicitar tarjeta',
  cta_secundaria: 'Conocer el producto',
  etiquetas: ['100% digital'],
  perfiles: ['Score Alto'],
  requisitos: ['Ser mayor de 18 años'],
  caracteristicas: ['Tarjeta virtual al instante'],
  tarifas: [{ concepto: 'Cuota de manejo', valor: '$0 los primeros 6 meses' }],
};

// Un producto viejo de la base, con campos vacíos y listas en null
const OFERTA_INCOMPLETA_MID = {
  ...OFERTA_MID,
  id: 1,
  slug: 'credito-personal',
  aliado: 'Banco Colombiano',
  tipo: 'banco',
  familia: 'creditos',
  beneficio: '',
  logo_texto: '',
  logo_fondo: '',
  promesa: '',
  cta_primaria: '',
  categoria: 'Credito Personal',
  etiquetas: null,
  perfiles: null,
  requisitos: null,
  caracteristicas: null,
  tarifas: null,
};

describe('AlianzasService', () => {
  let service: AlianzasService;
  let http: HttpTestingController;

  function crear(conSesion: boolean): void {
    sessionStorage.clear();
    if (conSesion) {
      sessionStorage.setItem(
        'financeup_user',
        JSON.stringify({ id: 6, email: 'a@b.co', nombre: 'Ana', rol: 'user', token: 'abc' })
      );
    }
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AlianzasService);
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  it('carga las ofertas del MID y traduce familia, tipo y beneficio', () => {
    crear(false);
    service.cargarOfertas();
    http.expectOne(`${API_URL}/ofertas`).flush([OFERTA_MID]);

    const oferta = service.ofertas()[0];
    expect(oferta.id).toBe(6);
    expect(oferta.familia).toBe('Tarjetas');
    expect(oferta.tipo).toBe('Fintech');
    expect(oferta.beneficio).toBe('Cashback');
    expect(oferta.logoText).toBe('FL');
    expect(oferta.imagen).toBe('assets/img/alianzas/tarjeta-digital.webp');
    expect(oferta.tarifas[0].concepto).toBe('Cuota de manejo');
    expect(service.cargando()).toBe(false);
  });

  it('rellena lo que falta en un producto incompleto', () => {
    crear(false);
    service.cargarOfertas();
    http.expectOne(`${API_URL}/ofertas`).flush([OFERTA_INCOMPLETA_MID]);

    const oferta = service.ofertas()[0];
    expect(oferta.familia).toBe('Créditos');
    expect(oferta.beneficio).toBeNull();
    expect(oferta.logoText).toBe('BC');
    expect(oferta.promesa).toBe('Credito Personal');
    expect(oferta.ctaPrimaria).toBe('Solicitar');
    expect(oferta.etiquetas).toEqual([]);
    expect(oferta.caracteristicas).toEqual([]);
    expect(oferta.imagen).toBeUndefined();
  });

  it('si el MID falla deja el mensaje de error', () => {
    crear(false);
    service.cargarOfertas();
    http.expectOne(`${API_URL}/ofertas`).flush({ error: 'El CRUD no responde' }, { status: 502, statusText: 'Bad Gateway' });

    expect(service.error()).toBe('El CRUD no responde');
    expect(service.cargando()).toBe(false);
  });

  it('la ficha trae montos mínimos, preguntas y relacionadas', () => {
    crear(false);
    let ficha: any;
    service.obtenerFicha(6).subscribe((f) => (ficha = f));
    http.expectOne(`${API_URL}/ofertas/6`).flush({
      ...OFERTA_MID,
      monto_minimo: 500000,
      plazo_minimo: 6,
      documentos: ['Cédula'],
      preguntas: [{ pregunta: '¿Hay cuota?', respuesta: 'No' }],
      relacionadas: [{ id: 9, categoria: 'Compra ahora', tasa_desde: 0 }],
    });

    expect(ficha.montoMinimo).toBe(500000);
    expect(ficha.plazoMinimo).toBe(6);
    expect(ficha.documentos).toEqual(['Cédula']);
    expect(ficha.preguntas[0].respuesta).toBe('No');
    expect(ficha.relacionadas[0]).toEqual({ id: 9, categoria: 'Compra ahora', tasaDesde: 0 });
  });

  it('radicar una solicitud manda el id del usuario y los datos del formulario', () => {
    crear(true);
    let radicada: any;
    service
      .radicarSolicitud({
        idProducto: 6,
        monto: 3000000,
        plazoMeses: 24,
        nombre: 'Ana Gómez',
        documento: '1010101010',
        correo: 'a@b.co',
        celular: '3001234567',
        ingresos: 4000000,
        aceptaTerminos: true,
      })
      .subscribe((r) => (radicada = r));

    const peticion = http.expectOne(`${API_URL}/solicitud-credito`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      id_usuario: 6,
      id_producto: 6,
      monto: 3000000,
      plazo_meses: 24,
      nombre: 'Ana Gómez',
      documento: '1010101010',
      correo: 'a@b.co',
      celular: '3001234567',
      ingresos: 4000000,
      acepta_terminos: true,
    });
    peticion.flush({
      id_solicitud: 12,
      radicado: 'SOL-123456',
      producto: 'Tarjeta de crédito digital',
      monto: 3000000,
      plazo_meses: 24,
      cuota_estimada: 151234.5,
      estado: 'En estudio',
      asesor: 'Laura Pérez',
    });

    expect(radicada.radicado).toBe('SOL-123456');
    expect(radicada.cuotaEstimada).toBe(151234.5);
    expect(radicada.asesor).toBe('Laura Pérez');
  });

  it('las solicitudes del admin traducen el estado y la fecha', () => {
    crear(true);
    service.cargarSolicitudesAdmin();
    http.expectOne(`${API_URL}/admin/solicitudes-credito`).flush([
      {
        id_solicitud: 12,
        radicado: 'SOL-123456',
        nombre: 'Ana Gómez',
        correo: 'a@b.co',
        producto: 'Tarjeta de crédito digital',
        aliado: 'Fintech Luz',
        monto: 3000000,
        plazo_meses: 24,
        fecha: '2026-11-25',
        estado: 'nuevo',
      },
    ]);

    const solicitud = service.solicitudes()[0];
    expect(solicitud.estado).toBe('En estudio');
    expect(solicitud.plazoMeses).toBe(24);
    expect(solicitud.fecha).toBe('25 de noviembre de 2026');
  });

  it('carga las solicitudes del usuario de la sesión con estado y fecha legibles', () => {
    crear(true);
    service.cargarMisSolicitudes();
    http.expectOne(`${API_URL}/solicitud-credito/usuario/6`).flush([
      {
        id_solicitud: 12,
        radicado: 'SOL-123456',
        producto: 'Tarjeta de crédito digital',
        monto: 3000000,
        plazo_meses: 24,
        estado: 'nuevo',
        fecha_solicitud: '2026-11-25T14:21:23.112789Z',
      },
    ]);

    const solicitud = service.misSolicitudes()[0];
    expect(solicitud.radicado).toBe('SOL-123456');
    expect(solicitud.plazoMeses).toBe(24);
    expect(solicitud.estado).toBe('En estudio');
    expect(solicitud.fecha).toBe('25 de noviembre de 2026');
  });

  it('si falla mis solicitudes no toca el error del catálogo', () => {
    crear(true);
    service.cargarMisSolicitudes();
    http
      .expectOne(`${API_URL}/solicitud-credito/usuario/6`)
      .flush({ error: 'El CRUD no responde' }, { status: 502, statusText: 'Bad Gateway' });

    expect(service.errorSolicitudes()).toBe('El CRUD no responde');
    expect(service.error()).toBe('');
  });

  it('sin sesión no pide solicitudes', () => {
    crear(false);
    service.cargarMisSolicitudes();

    http.expectNone(() => true);
    expect(service.misSolicitudes()).toEqual([]);
  });
});
