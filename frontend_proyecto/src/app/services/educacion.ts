import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_URL, mensajeDeError } from './api';
import { AuthService } from './auth';
import {
  AvanceCurso,
  Certificado,
  Clase,
  Curso,
  EscuelaCursos,
  FormatoCurso,
  Leccion,
  NivelCurso,
  TipoLeccion,
} from '../pages/educacion/educacion/educacion.model';

// ------------------------------------------------------------
// Cómo responde el MID (nombres en snake_case, textos en minúscula)
// ------------------------------------------------------------

interface CursoMid {
  id: number;
  slug: string;
  titulo: string;
  imagen: string;
  categoria: string;
  nivel: string;
  formato: string;
  duracion: string;
  resumen_lecciones: string;
  certificado: boolean;
  descripcion: string;
  estudiantes: number;
  calificacion: number;
  // En el catálogo el instructor es solo el nombre; en el detalle es un objeto
  instructor: string | { nombre: string; cargo: string; iniciales: string };
  // Solo en el detalle (GET /cursos/:id)
  actualizado?: string;
  aprenderas?: string[];
  requisitos?: string[];
  progreso?: number;
  lecciones?: LeccionMid[];
}

interface LeccionMid {
  id: number;
  titulo: string;
  tipo: string;
  duracion_min: number;
  resumen: string;
  completada: boolean;
}

interface EscuelaMid {
  id: number;
  slug: string;
  nombre: string;
  descripcion: string;
  cursos: CursoMid[];
}

interface ProgresoMid {
  modulos: { id_modulo: number; porcentaje: number }[];
}

interface ClaseMid {
  id: number;
  id_curso: number;
  numero: number;
  titulo: string;
  tipo: string;
  duracion_min: number;
  resumen: string;
  url_video: string;
  contenido: string;
  id_siguiente_clase: number;
}

// ------------------------------------------------------------
// Traducción MID → pantalla
// ------------------------------------------------------------

const NIVELES: Record<string, NivelCurso> = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' };
const FORMATOS: Record<string, FormatoCurso> = { video: 'Video', articulo: 'Artículo', quiz: 'Quiz' };
const TIPOS: Record<string, TipoLeccion> = { video: 'Video', lectura: 'Lectura', quiz: 'Quiz' };

/** "Mariana Escobar Uribe" → "ME" */
function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}

/** "2026-11-25" → "noviembre de 2026" */
function mesYAnio(fecha: string | undefined): string {
  if (!fecha) return '';
  const [anio, mes] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

function aLeccion(leccion: LeccionMid): Leccion {
  return {
    id: leccion.id,
    titulo: leccion.titulo,
    tipo: TIPOS[leccion.tipo] ?? 'Video',
    duracionMin: leccion.duracion_min,
    resumen: leccion.resumen,
    completada: leccion.completada,
  };
}

function aCurso(curso: CursoMid): Curso {
  const instructor =
    typeof curso.instructor === 'string'
      ? { nombre: curso.instructor, cargo: '', iniciales: iniciales(curso.instructor) }
      : curso.instructor;

  return {
    id: curso.id,
    slug: curso.slug,
    titulo: curso.titulo,
    // Las rutas vienen como "/assets/..."; sin la barra funcionan también en GitHub Pages
    imagen: curso.imagen.replace(/^\//, ''),
    categoria: curso.categoria,
    nivel: NIVELES[curso.nivel] ?? 'Básico',
    formato: FORMATOS[curso.formato] ?? 'Video',
    duracion: curso.duracion,
    resumenLecciones: curso.resumen_lecciones,
    certificado: curso.certificado,
    descripcion: curso.descripcion,
    progreso: curso.progreso ?? 0,
    instructor,
    estudiantes: curso.estudiantes,
    calificacion: curso.calificacion,
    actualizado: mesYAnio(curso.actualizado),
    aprenderas: curso.aprenderas ?? [],
    requisitos: curso.requisitos ?? [],
    lecciones: (curso.lecciones ?? []).map(aLeccion),
  };
}

/**
 * Educación: catálogo, detalle de curso, clases, avance y certificado.
 * Todo sale del MID; el avance se guarda con el id del usuario de la sesión.
 */
@Injectable({
  providedIn: 'root',
})
export class EducacionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Signals: las pantallas se actualizan cuando responde el MID (la app no usa zone.js)
  readonly escuelas = signal<EscuelaCursos[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  private get idUsuario(): number | undefined {
    return this.authService.obtenerUsuario()?.id;
  }

  // ---------- Catálogo ----------

  /** Trae escuelas y cursos; con sesión, también el % de avance de cada curso. */
  cargarCatalogo(): void {
    this.cargando.set(true);
    this.error.set('');

    this.http.get<EscuelaMid[]>(`${API_URL}/cursos`).subscribe({
      next: (escuelas) => {
        this.escuelas.set(
          escuelas.map((escuela) => ({
            id: escuela.id,
            slug: escuela.slug,
            nombre: escuela.nombre,
            descripcion: escuela.descripcion,
            cursos: escuela.cursos.map(aCurso),
          }))
        );
        this.cargando.set(false);
        this.cargarAvance();
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /** Pone en cada curso del catálogo el % que lleva el usuario. */
  private cargarAvance(): void {
    if (!this.idUsuario) return;

    this.http.get<ProgresoMid>(`${API_URL}/progreso-educativo/${this.idUsuario}`).subscribe({
      next: (progreso) => {
        const porcentaje = new Map(progreso.modulos.map((m) => [m.id_modulo, m.porcentaje]));

        this.escuelas.update((escuelas) =>
          escuelas.map((escuela) => ({
            ...escuela,
            cursos: escuela.cursos.map((curso) => ({ ...curso, progreso: porcentaje.get(curso.id) ?? 0 })),
          }))
        );
      },
      // Si el avance no llega, los cursos se quedan en 0% y el catálogo sigue usable
      error: () => {},
    });
  }

  todosLosCursos(): Curso[] {
    return this.escuelas().flatMap((escuela) => escuela.cursos);
  }

  buscarPorSlug(slug: string): Curso | undefined {
    return this.todosLosCursos().find((curso) => curso.slug === slug);
  }

  escuelaDeCurso(cursoId: number): EscuelaCursos | undefined {
    return this.escuelas().find((escuela) => escuela.cursos.some((curso) => curso.id === cursoId));
  }

  /** Curso que el usuario dejó a medias (el más avanzado), para la banda de "continuar". */
  cursoEnProgreso(): Curso | undefined {
    return this.todosLosCursos()
      .filter((curso) => curso.progreso > 0 && curso.progreso < 100)
      .sort((a, b) => b.progreso - a.progreso)[0];
  }

  // ---------- Curso y clases ----------

  /** Detalle con lecciones; con sesión marca las que el usuario ya completó. */
  cargarCurso(id: number): Observable<Curso> {
    const usuario = this.idUsuario ? `?usuario=${this.idUsuario}` : '';
    return this.http.get<CursoMid>(`${API_URL}/cursos/${id}${usuario}`).pipe(map(aCurso));
  }

  obtenerClase(id: number): Observable<Clase> {
    return this.http.get<ClaseMid>(`${API_URL}/clase/${id}`).pipe(
      map((clase) => ({
        id: clase.id,
        idCurso: clase.id_curso,
        numero: clase.numero,
        titulo: clase.titulo,
        tipo: TIPOS[clase.tipo] ?? 'Video',
        duracionMin: clase.duracion_min,
        resumen: clase.resumen,
        urlVideo: clase.url_video,
        contenido: clase.contenido,
        idSiguiente: clase.id_siguiente_clase,
      }))
    );
  }

  /** Marca la clase como vista; el MID recalcula el % del curso. */
  completarLeccion(leccionId: number): Observable<AvanceCurso> {
    return this.http
      .post<{ id_curso: number; lecciones_completadas: number; lecciones_totales: number; porcentaje: number }>(
        `${API_URL}/clase/${leccionId}/completar`,
        { id_usuario: this.idUsuario }
      )
      .pipe(
        map((avance) => ({
          idCurso: avance.id_curso,
          leccionesCompletadas: avance.lecciones_completadas,
          leccionesTotales: avance.lecciones_totales,
          porcentaje: avance.porcentaje,
        }))
      );
  }

  /** Deja todas las clases del curso sin ver y el % en 0. */
  reiniciarCurso(cursoId: number): Observable<unknown> {
    return this.http.post(`${API_URL}/cursos/${cursoId}/reiniciar`, { id_usuario: this.idUsuario });
  }

  /** El MID solo lo entrega si el curso da certificado y va al 100%. */
  emitirCertificado(cursoId: number): Observable<Certificado> {
    return this.http
      .post<{ codigo: string; estudiante: string; curso: string; duracion: string; fecha_emision: string }>(
        `${API_URL}/certificado`,
        { id_usuario: this.idUsuario, id_modulo: cursoId }
      )
      .pipe(
        map((certificado) => ({
          codigo: certificado.codigo,
          estudiante: certificado.estudiante,
          curso: certificado.curso,
          duracion: certificado.duracion,
          fechaEmision: certificado.fecha_emision,
        }))
      );
  }

  // ---------- Ayudas para las pantallas ----------

  /** Primera lección sin completar; si están todas, la última. */
  siguienteLeccion(curso: Curso): Leccion | undefined {
    return curso.lecciones.find((leccion) => !leccion.completada) ?? curso.lecciones[curso.lecciones.length - 1];
  }

  minutosRestantes(curso: Curso): number {
    return curso.lecciones
      .filter((leccion) => !leccion.completada)
      .reduce((total, leccion) => total + leccion.duracionMin, 0);
  }
}
