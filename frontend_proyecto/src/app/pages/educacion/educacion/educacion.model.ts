// Modelos de datos de Educación.
// Los datos vienen del MID (/v1/cursos, /v1/clase, /v1/certificado);
// EducacionService los traduce a estas interfaces para las pantallas.

export type NivelCurso = 'Básico' | 'Intermedio' | 'Avanzado';
export type FormatoCurso = 'Video' | 'Artículo' | 'Quiz';
export type TipoLeccion = 'Video' | 'Lectura' | 'Quiz';

export interface Leccion {
  id: number;
  titulo: string;
  tipo: TipoLeccion;
  duracionMin: number;
  resumen: string;
  completada: boolean;
}

export interface Instructor {
  nombre: string;
  cargo: string;
  iniciales: string;
}

export interface Curso {
  id: number;
  slug: string; // nombre corto, ej: "presupuesto-50-30-20"
  titulo: string;
  imagen: string; // URL o ruta de la imagen de portada
  categoria: string; // debe coincidir con el id de una CategoriaFiltro
  nivel: NivelCurso;
  formato: FormatoCurso;
  duracion: string; // ej: "45 minutos"
  resumenLecciones: string; // ej: "5 Lecciones + 1 Evaluación"
  certificado: boolean;
  descripcion: string;
  progreso: number; // 0 - 100, lo calcula el MID

  // Ficha del curso
  instructor: Instructor;
  estudiantes: number;
  calificacion: number;
  actualizado: string;
  aprenderas: string[];
  requisitos: string[];
  lecciones: Leccion[]; // vacío en el catálogo; llega con el detalle del curso
}

export interface EscuelaCursos {
  id: number;
  slug: string;
  nombre: string; // ej: "Escuela de Finanzas Personales"
  descripcion: string;
  cursos: Curso[];
}

export interface OpcionFiltro {
  id: string;
  etiqueta: string;
}

/** Una clase con su contenido (GET /v1/clase/:id). */
export interface Clase {
  id: number;
  idCurso: number;
  numero: number;
  titulo: string;
  tipo: TipoLeccion;
  duracionMin: number;
  resumen: string;
  urlVideo: string;
  contenido: string;
  idSiguiente: number; // 0 si es la última
}

/** Respuesta de POST /v1/clase/:id/completar. */
export interface AvanceCurso {
  idCurso: number;
  leccionesCompletadas: number;
  leccionesTotales: number;
  porcentaje: number;
}

/** Respuesta de POST /v1/certificado. */
export interface Certificado {
  codigo: string;
  estudiante: string;
  curso: string;
  duracion: string;
  fechaEmision: string; // "2026-11-25"
}
