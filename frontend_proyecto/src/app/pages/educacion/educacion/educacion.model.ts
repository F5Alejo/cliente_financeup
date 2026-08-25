// Modelos de datos del catálogo de cursos.
// Toda la información mostrada en pantalla sale de estas interfaces,
// así que para agregar/editar contenido solo se toca el arreglo en el servicio,
// nunca el HTML.

export type NivelCurso = 'Básico' | 'Intermedio' | 'Avanzado';
export type FormatoCurso = 'Video' | 'Artículo' | 'Quiz';
export type TipoLeccion = 'Video' | 'Lectura' | 'Quiz';

export interface Leccion {
  id: string;
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
  id: string;
  titulo: string;
  imagen: string; // URL o ruta de la imagen de portada
  categoria: string; // debe coincidir con el id de una CategoriaFiltro
  nivel: NivelCurso;
  formato: FormatoCurso;
  duracion: string; // ej: "45 minutos"
  resumenLecciones: string; // ej: "5 Lecciones + 1 Evaluación"
  certificado: boolean;
  descripcion: string;
  progreso: number; // 0 - 100, derivado de las lecciones completadas
  contenido: string[]; // temario, en orden

  // Ficha del curso
  instructor: Instructor;
  estudiantes: number;
  calificacion: number;
  actualizado: string;
  aprenderas: string[];
  requisitos: string[];
  lecciones: Leccion[];
}

export interface EscuelaCursos {
  id: string;
  nombre: string; // ej: "Escuela de Finanzas Personales"
  descripcion: string;
  cursos: Curso[];
}

export interface OpcionFiltro {
  id: string;
  etiqueta: string;
}

export interface ProgresoGeneral {
  porcentaje: number;
  moduloActual: number;
  moduloTotal: number;
  minutosRestantes: number;
}
