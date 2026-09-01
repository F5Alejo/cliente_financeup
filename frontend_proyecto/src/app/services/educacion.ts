import { Injectable, signal } from '@angular/core';
import {
  Curso,
  EscuelaCursos,
  Leccion,
  TipoLeccion,
} from '../pages/educacion/educacion/educacion.model';

// Arma las lecciones de un curso a partir de tuplas [título, tipo, minutos, resumen].
function lecciones(
  cursoId: string,
  items: [string, TipoLeccion, number, string][]
): Leccion[] {
  return items.map(([titulo, tipo, duracionMin, resumen], i) => ({
    id: `${cursoId}-l${i + 1}`,
    titulo,
    tipo,
    duracionMin,
    resumen,
    completada: false,
  }));
}

@Injectable({
  providedIn: 'root'
})
export class EducacionService {
  // Señal que cambia cada vez que se completa una lección, para refrescar las vistas.
  readonly version = signal(0);

  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
  escuelas: EscuelaCursos[] = [
    {
      id: 'finanzas-personales',
      nombre: 'Finanzas Personales',
      descripcion: 'Ordena tu plata mes a mes: presupuesto, crédito y deuda.',
      cursos: [
        {
          id: 'presupuesto-50-30-20',
          titulo: 'Presupuesto 50/30/20',
          imagen: '/assets/cursos/presupuesto.svg',
          categoria: 'fundamentos',
          nivel: 'Básico',
          formato: 'Video',
          duracion: '30 minutos',
          resumenLecciones: '4 lecciones + evaluación',
          certificado: true,
          descripcion:
            'Reparte tu sueldo entre necesidades, gustos y ahorro sin llevar una hoja de cálculo interminable.',
          progreso: 0,
          contenido: [],
          instructor: {
            nombre: 'Mariana Escobar Uribe',
            cargo: 'Asesora financiera, 9 años en banca personal',
            iniciales: 'ME',
          },
          estudiantes: 4812,
          calificacion: 4.7,
          actualizado: 'Julio 2026',
          aprenderas: [
            'Repartir tu ingreso mensual en tres bolsillos',
            'Distinguir un gasto fijo de uno que puedes recortar',
            'Ajustar la regla cuando tu ingreso es variable',
          ],
          requisitos: ['Conocer tu ingreso mensual aproximado'],
          lecciones: lecciones('presupuesto-50-30-20', [
            ['Qué resuelve la regla 50/30/20', 'Video', 6, 'De dónde sale la regla y por qué funciona mejor que anotar cada gasto.'],
            ['Clasifica tus gastos en tres bolsillos', 'Video', 8, 'Necesidades, gustos y ahorro: dónde entra el arriendo, el plan de datos y las salidas.'],
            ['Los tres errores que rompen el presupuesto', 'Lectura', 5, 'Presupuestar sobre el bruto, olvidar los gastos anuales y no dejar colchón.'],
            ['Arma tu primer presupuesto', 'Video', 9, 'Aterrizamos la regla sobre un sueldo real de 2.800.000 al mes.'],
            ['Evaluación final', 'Quiz', 4, 'Cinco preguntas para confirmar que puedes repartir tu ingreso solo.'],
          ]),
        },
        {
          id: 'tarjetas-responsable',
          titulo: 'Usa bien tu tarjeta de crédito',
          imagen: '/assets/cursos/tarjetas.svg',
          categoria: 'credito',
          nivel: 'Básico',
          formato: 'Video',
          duracion: '35 minutos',
          resumenLecciones: '4 lecciones + evaluación',
          certificado: true,
          descripcion:
            'Entiende el cupo, la cuota mínima y los intereses antes de que ellos te entiendan a ti.',
          progreso: 0,
          contenido: [],
          instructor: {
            nombre: 'Julián Restrepo Vélez',
            cargo: 'Ex analista de riesgo crediticio',
            iniciales: 'JR',
          },
          estudiantes: 6390,
          calificacion: 4.8,
          actualizado: 'Agosto 2026',
          aprenderas: [
            'Leer un extracto sin perderte',
            'Calcular cuánto te cuesta pagar la cuota mínima',
            'Aprovechar el período de gracia a tu favor',
          ],
          requisitos: ['Tener o estar por pedir una tarjeta de crédito'],
          lecciones: lecciones('tarjetas-responsable', [
            ['Cómo funciona una tarjeta por dentro', 'Video', 7, 'Cupo, fecha de corte y fecha límite de pago explicados sobre un extracto real.'],
            ['El costo real de la cuota mínima', 'Video', 9, 'Qué pasa con una deuda de 1.200.000 si solo pagas el mínimo durante un año.'],
            ['Diferir a cuotas sin perder plata', 'Lectura', 6, 'Cuándo diferir sale barato y cuándo es mejor pagar de contado.'],
            ['Señales de que la tarjeta te está ganando', 'Video', 8, 'Los cuatro comportamientos que anteceden a un sobreendeudamiento.'],
            ['Evaluación final', 'Quiz', 5, 'Pon a prueba lo que aprendiste sobre intereses y fechas de corte.'],
          ]),
        },
        {
          id: 'historial-desde-cero',
          titulo: 'Entiende tu puntaje de crédito',
          imagen: '/assets/cursos/historial.svg',
          categoria: 'credito',
          nivel: 'Básico',
          formato: 'Video',
          duracion: '45 minutos',
          resumenLecciones: '4 lecciones + evaluación',
          certificado: true,
          descripcion:
            'Qué mira una entidad cuando te consulta en centrales de riesgo y cómo subir tu score.',
          progreso: 0,
          contenido: [],
          instructor: {
            nombre: 'Julián Restrepo Vélez',
            cargo: 'Ex analista de riesgo crediticio',
            iniciales: 'JR',
          },
          estudiantes: 8145,
          calificacion: 4.9,
          actualizado: 'Agosto 2026',
          aprenderas: [
            'Qué pesa y qué no pesa en tu score',
            'Cada cuánto conviene consultar tu historial',
            'Cómo recuperarte de un reporte negativo',
          ],
          requisitos: ['Ninguno, puedes empezar sin historial crediticio'],
          lecciones: lecciones('historial-desde-cero', [
            ['Qué es el puntaje y quién lo calcula', 'Video', 8, 'Datacrédito, TransUnion y de dónde salen los datos que reportan sobre ti.'],
            ['Los cinco factores que mueven tu score', 'Video', 11, 'Historial de pago, uso del cupo, antigüedad, mezcla de productos y consultas.'],
            ['Mitos que circulan sobre el crédito', 'Lectura', 7, 'Consultar tu score no lo baja, y cerrar tarjetas no siempre ayuda.'],
            ['Plan de 6 meses para subir tu puntaje', 'Video', 12, 'Qué hacer mes a mes si vienes de un reporte negativo.'],
            ['Evaluación final', 'Quiz', 5, 'Confirma que sabes leer tu historial antes de pedir un crédito.'],
          ]),
        },
        {
          id: 'salir-de-deudas',
          titulo: 'Sal de deudas con el método bola de nieve',
          imagen: '/assets/cursos/deudas.svg',
          categoria: 'deuda',
          nivel: 'Intermedio',
          formato: 'Artículo',
          duracion: '28 minutos',
          resumenLecciones: '3 lecciones + evaluación',
          certificado: false,
          descripcion:
            'Ordena tus deudas y decide cuál pagar primero cuando el dinero no alcanza para todas.',
          progreso: 0,
          contenido: [],
          instructor: {
            nombre: 'Daniela Cifuentes Mora',
            cargo: 'Educadora financiera',
            iniciales: 'DC',
          },
          estudiantes: 3127,
          calificacion: 4.6,
          actualizado: 'Junio 2026',
          aprenderas: [
            'Inventariar todo lo que debes en una sola tabla',
            'Elegir entre bola de nieve y avalancha',
            'Negociar un acuerdo de pago sin miedo',
          ],
          requisitos: ['Tener al menos una deuda activa'],
          lecciones: lecciones('salir-de-deudas', [
            ['Inventario: cuánto debes de verdad', 'Lectura', 8, 'Saldo, tasa y cuota de cada deuda en una sola tabla.'],
            ['Bola de nieve contra avalancha', 'Lectura', 9, 'Una da motivación temprana, la otra ahorra más intereses. Cuál te sirve.'],
            ['Cómo negociar con la entidad', 'Lectura', 7, 'Qué pedir, con quién hablar y qué dejar por escrito.'],
            ['Evaluación final', 'Quiz', 4, 'Arma el orden de pago de un caso con cuatro deudas.'],
          ]),
        },
      ],
    },
    {
      id: 'inversion',
      nombre: 'Inversión',
      descripcion: 'Del primer fondo a un portafolio que puedas sostener.',
      cursos: [
        {
          id: 'intro-bolsa',
          titulo: 'Primeros pasos en la bolsa',
          imagen: '/assets/cursos/bolsa.svg',
          categoria: 'fundamentos',
          nivel: 'Básico',
          formato: 'Video',
          duracion: '35 minutos',
          resumenLecciones: '3 lecciones + evaluación',
          certificado: true,
          descripcion:
            'Qué se compra y se vende en una bolsa de valores, y cómo abrir tu primera cuenta en Colombia.',
          progreso: 0,
          contenido: [],
          instructor: {
            nombre: 'Óscar Bermúdez Lara',
            cargo: 'Gestor de portafolios',
            iniciales: 'OB',
          },
          estudiantes: 5674,
          calificacion: 4.7,
          actualizado: 'Julio 2026',
          aprenderas: [
            'Diferenciar acción, bono y fondo',
            'Abrir cuenta en una comisionista',
            'Calcular cuánto te cobran por operar',
          ],
          requisitos: ['Tener un fondo de emergencia armado'],
          lecciones: lecciones('intro-bolsa', [
            ['Qué es y para qué sirve una bolsa', 'Video', 9, 'Quién emite, quién compra y qué papel juega la comisionista.'],
            ['Acciones, bonos y fondos', 'Video', 11, 'Tres instrumentos, tres niveles de riesgo, tres horizontes de tiempo.'],
            ['Abre tu primera cuenta', 'Lectura', 10, 'Documentos, montos mínimos y comisiones de las casas más usadas.'],
            ['Evaluación final', 'Quiz', 5, 'Identifica qué instrumento encaja en cada objetivo.'],
          ]),
        },
        {
          id: 'intro-criptomonedas',
          titulo: 'Criptomonedas sin humo',
          imagen: '/assets/cursos/cripto.svg',
          categoria: 'fundamentos',
          nivel: 'Básico',
          formato: 'Video',
          duracion: '40 minutos',
          resumenLecciones: '3 lecciones + evaluación',
          certificado: true,
          descripcion:
            'Qué hay detrás de una criptomoneda, qué riesgos asumes y cómo evitar las estafas más comunes.',
          progreso: 0,
          contenido: [],
          instructor: {
            nombre: 'Óscar Bermúdez Lara',
            cargo: 'Gestor de portafolios',
            iniciales: 'OB',
          },
          estudiantes: 7203,
          calificacion: 4.4,
          actualizado: 'Agosto 2026',
          aprenderas: [
            'Explicar qué es una blockchain sin tecnicismos',
            'Reconocer una estafa piramidal disfrazada',
            'Custodiar tus llaves de forma segura',
          ],
          requisitos: ['Ninguno'],
          lecciones: lecciones('intro-criptomonedas', [
            ['Qué es una criptomoneda', 'Video', 10, 'Por qué existe, quién la emite y qué la respalda.'],
            ['Blockchain explicada con un ejemplo', 'Video', 12, 'Un libro contable que nadie puede borrar, contado con una cuenta de tienda.'],
            ['Riesgos y estafas frecuentes', 'Lectura', 13, 'Rendimientos garantizados, referidos obligatorios y otras banderas rojas.'],
            ['Evaluación final', 'Quiz', 5, 'Detecta las banderas rojas en tres casos reales.'],
          ]),
        },
        {
          id: 'gestion-portafolio',
          titulo: 'Arma y rebalancea tu portafolio',
          imagen: '/assets/cursos/portafolio.svg',
          categoria: 'fundamentos',
          nivel: 'Avanzado',
          formato: 'Quiz',
          duracion: '30 minutos',
          resumenLecciones: '3 lecciones + evaluación',
          certificado: true,
          descripcion:
            'Cómo repartir lo que inviertes y cada cuánto volver a ajustar los pesos.',
          progreso: 0,
          contenido: [],
          instructor: {
            nombre: 'Óscar Bermúdez Lara',
            cargo: 'Gestor de portafolios',
            iniciales: 'OB',
          },
          estudiantes: 1948,
          calificacion: 4.8,
          actualizado: 'Mayo 2026',
          aprenderas: [
            'Definir pesos objetivo por tipo de activo',
            'Rebalancear sin disparar impuestos ni comisiones',
            'Medir tu portafolio con tres métricas',
          ],
          requisitos: ['Haber invertido antes', 'Curso de bolsa completado'],
          lecciones: lecciones('gestion-portafolio', [
            ['Pesos objetivo según tu horizonte', 'Lectura', 10, 'Cómo cambia la mezcla si tu meta está a 3, 10 o 25 años.'],
            ['Cuándo y cómo rebalancear', 'Video', 11, 'Por calendario o por desviación: dos disciplinas para no improvisar.'],
            ['Tres métricas para hacer seguimiento', 'Lectura', 6, 'Rentabilidad real, volatilidad y máxima caída.'],
            ['Evaluación final', 'Quiz', 5, 'Rebalancea un portafolio desviado 12 puntos de su objetivo.'],
          ]),
        },
      ],
    },
  ];

  constructor() {
    for (const escuela of this.escuelas) {
      for (const curso of escuela.cursos) {
        curso.contenido = curso.lecciones.map((l) => l.titulo);
      }
    }

    // Estado inicial de ejemplo: el usuario ya avanzó en el curso de puntaje.
    const enCurso = this.buscarCurso('historial-desde-cero');
    if (enCurso) {
      enCurso.lecciones[0].completada = true;
      enCurso.lecciones[1].completada = true;
    }

    this.recalcularTodo();
  }

  buscarCurso(cursoId: string): Curso | undefined {
    for (const escuela of this.escuelas) {
      const curso = escuela.cursos.find((c) => c.id === cursoId);
      if (curso) return curso;
    }
    return undefined;
  }

  escuelaDeCurso(cursoId: string): EscuelaCursos | undefined {
    return this.escuelas.find((e) => e.cursos.some((c) => c.id === cursoId));
  }

  /** Curso que el usuario dejó a medias, para la banda de "continuar". */
  cursoEnProgreso(): Curso | undefined {
    const iniciados = this.todosLosCursos().filter(
      (c) => c.progreso > 0 && c.progreso < 100
    );
    return iniciados.sort((a, b) => b.progreso - a.progreso)[0];
  }

  /** Primera lección sin completar; si están todas, la última. */
  siguienteLeccion(curso: Curso): Leccion {
    return curso.lecciones.find((l) => !l.completada) ?? curso.lecciones[curso.lecciones.length - 1];
  }

  indiceDeLeccion(curso: Curso, leccionId: string): number {
    return curso.lecciones.findIndex((l) => l.id === leccionId);
  }

  completarLeccion(cursoId: string, leccionId: string): void {
    const curso = this.buscarCurso(cursoId);
    const leccion = curso?.lecciones.find((l) => l.id === leccionId);
    if (!curso || !leccion) return;

    leccion.completada = true;
    this.recalcularProgreso(curso);
    this.version.update((v) => v + 1);
  }

  reiniciarCurso(cursoId: string): void {
    const curso = this.buscarCurso(cursoId);
    if (!curso) return;

    curso.lecciones.forEach((l) => (l.completada = false));
    this.recalcularProgreso(curso);
    this.version.update((v) => v + 1);
  }

  todosLosCursos(): Curso[] {
    return this.escuelas.flatMap((e) => e.cursos);
  }

  minutosRestantes(curso: Curso): number {
    return curso.lecciones
      .filter((l) => !l.completada)
      .reduce((total, l) => total + l.duracionMin, 0);
  }

  private recalcularTodo(): void {
    this.todosLosCursos().forEach((curso) => this.recalcularProgreso(curso));
  }

  private recalcularProgreso(curso: Curso): void {
    const total = curso.lecciones.length;
    const hechas = curso.lecciones.filter((l) => l.completada).length;
    curso.progreso = total === 0 ? 0 : Math.round((hechas / total) * 100);
  }

  agregarCurso(escuelaId: string, curso: Curso): void {
    const escuela = this.escuelas.find((e) => e.id === escuelaId);
    if (escuela) {
      escuela.cursos.push(curso);
    }
  }

  editarCurso(cursoId: string, cambios: Partial<Curso>): void {
    const curso = this.buscarCurso(cursoId);
    if (curso) {
      Object.assign(curso, cambios);
    }
  }

  eliminarCurso(cursoId: string): void {
    for (const escuela of this.escuelas) {
      escuela.cursos = escuela.cursos.filter((c) => c.id !== cursoId);
    }
  }
}
