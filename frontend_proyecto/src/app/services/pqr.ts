import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_URL, mensajeDeError } from './api';
import { AuthService } from './auth';
import { NotificacionesService } from './notificaciones';

export type EstadoPqr = 'Abierta' | 'En revisión' | 'Resuelta' | 'Cerrada' | 'Rechazada';
export type PrioridadPqr = 'Alta' | 'Media' | 'Baja';
export type TipoPqr = 'Petición' | 'Queja' | 'Reclamo' | 'Sugerencia';

/** PQR tal como la muestran las listas del usuario y del admin. */
export interface Pqr {
  id: number;
  radicado: string;
  titulo: string;
  tipo: string;
  categoria: string;
  prioridad: PrioridadPqr;
  estado: EstadoPqr;
  progreso: number;
  descripcion: string;
  asesor: string;
  usuario: string;
  fechaCreacion: string;
  ultimaActualizacion: string;
}

export interface MensajePqr {
  autor: string;
  mensaje: string;
  fecha: string;
}

export interface AdjuntoPqr {
  nombre: string;
  tipo: string;
  tamano: number;
}

/** Detalle de una PQR con la conversación (GET /pqr/radicado/:radicado). */
export interface DetallePqr extends Pqr {
  mensajeRespuesta: string;
  respuestas: MensajePqr[];
  adjuntos: AdjuntoPqr[];
}

/** Lo que el usuario llena en el formulario de nueva PQR. */
export interface DatosPqr {
  titulo: string;
  tipo: TipoPqr;
  categoria: string;
  prioridad: PrioridadPqr;
  descripcion: string;
  adjunto?: File | null;
}

// ---- Formato en que responde el MID (snake_case) ----

interface PqrMid {
  id_pqr: number;
  radicado: string;
  titulo: string;
  tipo: string;
  categoria?: string;
  prioridad: string;
  estado: string;
  progreso: number;
  descripcion?: string;
  asesor?: string;
  usuario?: string;
  fecha_creacion: string;
  ultima_actualizacion?: string;
}

interface DetalleMid extends PqrMid {
  mensaje_respuesta: string;
  respuestas: { autor: string; mensaje: string; fecha: string }[] | null;
  adjuntos: { nombre: string; ruta: string; tipo: string; tamano: number }[] | null;
}

// Nombre del estado en la base (tabla estado_pqr) → texto de pantalla
const ESTADOS: Record<string, EstadoPqr> = {
  Abierta: 'Abierta',
  'En Revision': 'En revisión',
  Resuelta: 'Resuelta',
  Cerrada: 'Cerrada',
  Rechazada: 'Rechazada',
};

// Texto de pantalla → nombre en la base y progreso que se guarda al cambiarlo
const ESTADO_EN_BASE: Record<EstadoPqr, { nombre: string; progreso: number }> = {
  Abierta: { nombre: 'Abierta', progreso: 10 },
  'En revisión': { nombre: 'En Revision', progreso: 50 },
  Resuelta: { nombre: 'Resuelta', progreso: 100 },
  Cerrada: { nombre: 'Cerrada', progreso: 100 },
  Rechazada: { nombre: 'Rechazada', progreso: 100 },
};

const TIPOS: Record<string, TipoPqr> = {
  peticion: 'Petición',
  queja: 'Queja',
  reclamo: 'Reclamo',
  sugerencia: 'Sugerencia',
};

const PRIORIDADES: Record<string, PrioridadPqr> = { alta: 'Alta', media: 'Media', baja: 'Baja' };

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2026-11-20T14:21:23Z" → "20 nov 2026" */
function fechaCorta(texto?: string): string {
  const [anio, mes, dia] = (texto ?? '').slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia || anio < 2000) return '';
  return `${dia} ${MESES[mes - 1]} ${anio}`;
}

/** "Reclamo" → "reclamo", "Petición" → "peticion" (el código que guarda la base). */
function codigoTipo(tipo: TipoPqr): string {
  return Object.keys(TIPOS).find((codigo) => TIPOS[codigo] === tipo) ?? 'peticion';
}

function aPqr(p: PqrMid): Pqr {
  return {
    id: p.id_pqr,
    radicado: p.radicado,
    titulo: p.titulo,
    tipo: TIPOS[p.tipo] ?? p.tipo,
    categoria: p.categoria ?? '',
    prioridad: PRIORIDADES[p.prioridad] ?? 'Media',
    estado: ESTADOS[p.estado] ?? 'Abierta',
    progreso: p.progreso,
    descripcion: p.descripcion ?? '',
    asesor: p.asesor || 'Por asignar',
    usuario: p.usuario ?? '',
    fechaCreacion: fechaCorta(p.fecha_creacion),
    ultimaActualizacion: fechaCorta(p.ultima_actualizacion),
  };
}

@Injectable({
  providedIn: 'root',
})
export class PqrService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private notificaciones = inject(NotificacionesService);

  /** PQR del usuario con sesión (GET /pqr/usuario/:id). */
  readonly misPqr = signal<Pqr[]>([]);
  /** Todas las PQR, para el panel del admin (GET /admin/pqr). */
  readonly pqrsAdmin = signal<Pqr[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  cargarMisPqr(): void {
    const idUsuario = this.authService.obtenerUsuario()?.id;
    if (!idUsuario) {
      this.misPqr.set([]);
      return;
    }

    this.cargarLista(`${API_URL}/pqr/usuario/${idUsuario}`, (lista) => this.misPqr.set(lista));
  }

  cargarPqrAdmin(): void {
    this.cargarLista(`${API_URL}/admin/pqr`, (lista) => this.pqrsAdmin.set(lista));
  }

  verPqr(radicado: string): Observable<DetallePqr> {
    return this.http.get<DetalleMid>(`${API_URL}/pqr/radicado/${encodeURIComponent(radicado)}`).pipe(
      map((d) => ({
        ...aPqr(d),
        mensajeRespuesta: d.mensaje_respuesta,
        respuestas: (d.respuestas ?? []).map((r) => ({ autor: r.autor, mensaje: r.mensaje, fecha: fechaCorta(r.fecha) })),
        adjuntos: (d.adjuntos ?? []).map((a) => ({ nombre: a.nombre, tipo: a.tipo, tamano: a.tamano })),
      }))
    );
  }

  /**
   * Radica una PQR nueva. Del adjunto solo se guardan nombre, tipo y tamaño:
   * el proyecto no tiene dónde almacenar archivos, por eso la ruta va vacía.
   */
  radicarPqr(datos: DatosPqr): Observable<{ idPqr: number; radicado: string }> {
    const cuerpo = {
      id_usuario: this.authService.obtenerUsuario()?.id,
      titulo: datos.titulo,
      tipo: codigoTipo(datos.tipo),
      categoria: datos.categoria,
      prioridad: datos.prioridad.toLowerCase(),
      descripcion: datos.descripcion,
      adjuntos: datos.adjunto
        ? [{ nombre_archivo: datos.adjunto.name, ruta_archivo: '', tipo_mime: datos.adjunto.type, tamano_bytes: datos.adjunto.size }]
        : [],
    };

    return this.http.post<{ id_pqr: number; radicado: string }>(`${API_URL}/pqr`, cuerpo).pipe(
      map((r) => {
        this.notificaciones.agregar({
          categoria: 'pqr',
          titulo: 'Nueva PQR recibida',
          detalle: `${datos.titulo} · ${r.radicado}.`,
          ruta: '/admin/pqr',
          nivel: datos.prioridad === 'Alta' ? 'warning' : 'info',
        });
        return { idPqr: r.id_pqr, radicado: r.radicado };
      })
    );
  }

  /** El dueño escribe en su PQR. El MID no le deja cambiar el estado. */
  responder(idPqr: number, mensaje: string): Observable<unknown> {
    return this.http.post(`${API_URL}/pqr/${idPqr}/respuesta`, { mensaje });
  }

  /** El admin responde y, si quiere, cambia el estado de la PQR. */
  responderComoAdmin(idPqr: number, mensaje: string, estado: EstadoPqr): Observable<unknown> {
    const enBase = ESTADO_EN_BASE[estado];
    return this.http.post(`${API_URL}/admin/pqr/${idPqr}/respuesta`, {
      mensaje,
      estado: enBase.nombre,
      progreso: enBase.progreso,
    });
  }

  private cargarLista(url: string, guardar: (lista: Pqr[]) => void): void {
    this.cargando.set(true);
    this.error.set('');

    this.http.get<PqrMid[]>(url).subscribe({
      next: (lista) => {
        guardar(lista.map(aPqr));
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }
}
