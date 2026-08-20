// Modelos de datos del catálogo de cursos.
// Toda la información mostrada en pantalla sale de estas interfaces,
// así que para agregar/editar contenido solo se toca el arreglo en el .ts,
// nunca el HTML.

export type NivelCurso = 'Básico' | 'Intermedio' | 'Avanzado';
export type FormatoCurso = 'Video' | 'Artículo' | 'Quiz';

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
  progreso: number; // 0 - 100
  contenido: string[]; // temario, en orden
}

export interface EscuelaCursos {
  id: string;
  nombre: string; // ej: "Escuela de Finanzas Personales"
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
