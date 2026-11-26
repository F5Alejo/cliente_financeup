import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { EducacionService } from './educacion';
import { API_URL } from './api';

// Así responde el MID GET /v1/cursos (escuelas con sus cursos)
const CATALOGO_MID = [
  {
    id: 1,
    slug: 'finanzas-personales',
    nombre: 'Finanzas Personales',
    descripcion: 'Ordena tu plata',
    cursos: [
      {
        id: 5,
        slug: 'presupuesto-50-30-20',
        titulo: 'Presupuesto 50/30/20',
        imagen: '/assets/cursos/presupuesto.svg',
        categoria: 'fundamentos',
        nivel: 'basico',
        formato: 'articulo',
        duracion: '30 minutos',
        resumen_lecciones: '4 lecciones + evaluación',
        certificado: true,
        descripcion: 'Reparte tu sueldo',
        estudiantes: 4812,
        calificacion: 4.7,
        instructor: 'Mariana Escobar Uribe',
      },
    ],
  },
];

// Así responde GET /v1/progreso-educativo/:id
const PROGRESO_MID = {
  id_usuario: 6,
  modulos_totales: 1,
  modulos_completados: 0,
  porcentaje_general: 40,
  modulos: [{ id_modulo: 5, titulo: 'Presupuesto 50/30/20', nivel: 'basico', porcentaje: 40, estado: 'en curso', calificacion: 0 }],
};

// Así responde GET /v1/cursos/:id?usuario=6
const DETALLE_MID = {
  ...CATALOGO_MID[0].cursos[0],
  actualizado: '2026-11-25',
  instructor: { nombre: 'Mariana Escobar Uribe', cargo: 'Asesora financiera', iniciales: 'ME' },
  aprenderas: ['Repartir tu ingreso'],
  requisitos: ['Conocer tu ingreso'],
  progreso: 50,
  lecciones: [
    { id: 11, titulo: 'Qué resuelve la regla', tipo: 'video', duracion_min: 6, resumen: 'De dónde sale', completada: true },
    { id: 12, titulo: 'Evaluación final', tipo: 'quiz', duracion_min: 4, resumen: 'Cinco preguntas', completada: false },
  ],
};

describe('EducacionService', () => {
  let service: EducacionService;
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
    service = TestBed.inject(EducacionService);
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  it('carga el catálogo del MID y traduce nivel, formato e imagen', () => {
    crear(false);
    service.cargarCatalogo();
    http.expectOne(`${API_URL}/cursos`).flush(CATALOGO_MID);

    const curso = service.escuelas()[0].cursos[0];
    expect(curso.id).toBe(5);
    expect(curso.slug).toBe('presupuesto-50-30-20');
    expect(curso.nivel).toBe('Básico');
    expect(curso.formato).toBe('Artículo');
    expect(curso.imagen).toBe('assets/cursos/presupuesto.svg');
    expect(curso.resumenLecciones).toBe('4 lecciones + evaluación');
    expect(curso.instructor.nombre).toBe('Mariana Escobar Uribe');
    expect(curso.instructor.iniciales).toBe('ME');
    expect(curso.progreso).toBe(0);
  });

  it('con sesión suma el avance de cada curso (progreso-educativo)', () => {
    crear(true);
    service.cargarCatalogo();
    http.expectOne(`${API_URL}/cursos`).flush(CATALOGO_MID);
    http.expectOne(`${API_URL}/progreso-educativo/6`).flush(PROGRESO_MID);

    expect(service.escuelas()[0].cursos[0].progreso).toBe(40);
    expect(service.cursoEnProgreso()?.id).toBe(5);
  });

  it('si falla el progreso el catálogo sigue visible con 0%', () => {
    crear(true);
    service.cargarCatalogo();
    http.expectOne(`${API_URL}/cursos`).flush(CATALOGO_MID);
    http
      .expectOne(`${API_URL}/progreso-educativo/6`)
      .flush({ error: 'El CRUD no responde' }, { status: 502, statusText: 'Bad Gateway' });

    expect(service.todosLosCursos().length).toBeGreaterThan(0);
    expect(service.todosLosCursos().every((curso) => curso.progreso === 0)).toBe(true);
    expect(service.error()).toBe('');
  });

  it('si el MID falla deja el mensaje de error', () => {
    crear(false);
    service.cargarCatalogo();
    http.expectOne(`${API_URL}/cursos`).flush({ error: 'El CRUD no responde' }, { status: 502, statusText: 'Bad Gateway' });

    expect(service.error()).toBe('El CRUD no responde');
    expect(service.cargando()).toBe(false);
  });

  it('el detalle del curso pide las lecciones del usuario de la sesión', () => {
    crear(true);
    let curso: any;
    service.cargarCurso(5).subscribe((c) => (curso = c));
    http.expectOne(`${API_URL}/cursos/5?usuario=6`).flush(DETALLE_MID);

    expect(curso.progreso).toBe(50);
    expect(curso.actualizado).toBe('noviembre de 2026');
    expect(curso.instructor.cargo).toBe('Asesora financiera');
    expect(curso.lecciones[0]).toEqual({
      id: 11,
      titulo: 'Qué resuelve la regla',
      tipo: 'Video',
      duracionMin: 6,
      resumen: 'De dónde sale',
      completada: true,
    });
    expect(curso.lecciones[1].tipo).toBe('Quiz');
  });

  it('una clase trae su contenido y cuál sigue', () => {
    crear(true);
    let clase: any;
    service.obtenerClase(11).subscribe((c) => (clase = c));
    http.expectOne(`${API_URL}/clase/11`).flush({
      id: 11,
      id_curso: 5,
      numero: 1,
      titulo: 'Qué resuelve la regla',
      tipo: 'video',
      duracion_min: 6,
      resumen: 'De dónde sale',
      url_video: '',
      contenido: 'Texto de la clase',
      id_siguiente_clase: 12,
    });

    expect(clase.idCurso).toBe(5);
    expect(clase.contenido).toBe('Texto de la clase');
    expect(clase.idSiguiente).toBe(12);
  });

  it('completar una clase manda el id del usuario', () => {
    crear(true);
    let avance: any;
    service.completarLeccion(12).subscribe((a) => (avance = a));
    const peticion = http.expectOne(`${API_URL}/clase/12/completar`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ id_usuario: 6 });
    peticion.flush({ id_leccion: 12, id_curso: 5, lecciones_completadas: 2, lecciones_totales: 2, porcentaje: 100 });

    expect(avance.porcentaje).toBe(100);
  });

  it('reiniciar un curso manda el id del usuario', () => {
    crear(true);
    service.reiniciarCurso(5).subscribe();
    const peticion = http.expectOne(`${API_URL}/cursos/5/reiniciar`);
    expect(peticion.request.body).toEqual({ id_usuario: 6 });
    peticion.flush({ id_curso: 5, porcentaje: 0, mensaje: 'Curso reiniciado' });
  });

  it('pide el certificado con el usuario y el curso', () => {
    crear(true);
    let certificado: any;
    service.emitirCertificado(5).subscribe((c) => (certificado = c));
    const peticion = http.expectOne(`${API_URL}/certificado`);
    expect(peticion.request.body).toEqual({ id_usuario: 6, id_modulo: 5 });
    peticion.flush({
      codigo: 'FUP-5-6-20261125',
      estudiante: 'Ana Gómez',
      curso: 'Presupuesto 50/30/20',
      duracion: '30 minutos',
      fecha_emision: '2026-11-25',
    });

    expect(certificado.codigo).toBe('FUP-5-6-20261125');
    expect(certificado.fechaEmision).toBe('2026-11-25');
  });
});
