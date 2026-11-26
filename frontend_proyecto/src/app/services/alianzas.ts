import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_URL, mensajeDeError } from './api';
import { AuthService } from './auth';
import { NotificacionesService } from './notificaciones';

export type TipoAliado = 'Bancos' | 'Fintech' | 'Comercio';
export type Beneficio = '0% Interés' | 'Cashback' | 'Sin Cuota';
export type Perfil = 'Score Alto' | 'Historial Nuevo';
export type FamiliaProducto = 'Créditos' | 'Tarjetas' | 'Ahorro' | 'Comercios';

export interface Tarifa {
  concepto: string;
  valor: string;
}

export interface Pregunta {
  pregunta: string;
  respuesta: string;
}

/** Producto de un aliado tal como lo usan las pantallas. */
export interface Oferta {
  id: number;
  slug: string;
  aliado: string;
  descripcion: string;
  meta: string;
  logoBg: string;
  logoText: string;
  imagen?: string;
  ctaPrimaria: string;
  ctaSecundaria: string;

  // Clasificación para los filtros
  tipo: TipoAliado;
  familia: FamiliaProducto;
  beneficio: Beneficio | null;
  perfiles: Perfil[];

  // Datos de la tarjeta
  categoria: string;
  promesa: string;
  tasaDesde: number;
  montoMaximo: number;
  plazoMaximo: number;
  aprobacion: string;
  calificacion: number;
  usuarios: number;
  compatibilidad: number;
  destacada: boolean;
  etiquetas: string[];
  requisitos: string[];
  caracteristicas: string[];
  tarifas: Tarifa[];
}

/** Ficha completa de un producto (GET /ofertas/:id). */
export interface FichaOferta extends Oferta {
  montoMinimo: number;
  plazoMinimo: number;
  documentos: string[];
  preguntas: Pregunta[];
  relacionadas: { id: number; categoria: string; tasaDesde: number }[];
}

/** Lo que el usuario llena en el formulario de solicitud. */
export interface DatosSolicitud {
  idProducto: number;
  monto: number;
  plazoMeses: number;
  nombre: string;
  documento: string;
  correo: string;
  celular: string;
  ingresos: number;
  aceptaTerminos: boolean;
}

/** Respuesta del MID al radicar. */
export interface SolicitudRadicada {
  idSolicitud: number;
  radicado: string;
  producto: string;
  monto: number;
  plazoMeses: number;
  cuotaEstimada: number;
  estado: string;
  asesor: string;
}

/** Fila de la tabla de solicitudes del admin. */
export interface Solicitud {
  idSolicitud: number;
  radicado: string;
  nombre: string;
  correo: string;
  producto: string;
  aliado: string;
  monto: number;
  plazoMeses: number;
  fecha: string;
  estado: string;
}

// ---- Formato en que responde el MID (snake_case) ----

interface OfertaMid {
  id: number;
  slug: string;
  aliado: string;
  tipo: string;
  logo_texto: string;
  logo_fondo: string;
  categoria: string;
  descripcion: string;
  promesa: string;
  meta: string;
  familia: string;
  beneficio: string;
  tasa_desde: number;
  monto_maximo: number;
  plazo_maximo: number;
  aprobacion: string;
  calificacion: number;
  usuarios: number;
  compatibilidad: number;
  destacada: boolean;
  cta_primaria: string;
  cta_secundaria: string;
  etiquetas: string[] | null;
  perfiles: string[] | null;
  requisitos: string[] | null;
  caracteristicas?: string[] | null;
  tarifas?: Tarifa[] | null;
}

interface FichaMid extends OfertaMid {
  monto_minimo: number;
  plazo_minimo: number;
  documentos: string[] | null;
  preguntas: Pregunta[] | null;
  relacionadas: { id: number; categoria: string; tasa_desde: number }[] | null;
}

interface SolicitudAdminMid {
  id_solicitud: number;
  radicado: string;
  nombre: string;
  correo: string;
  producto: string;
  aliado: string;
  monto: number;
  plazo_meses: number;
  fecha: string;
  estado: string;
}

// Traducción de los códigos de la base a los textos de pantalla
const TIPOS: Record<string, TipoAliado> = { banco: 'Bancos', fintech: 'Fintech', comercio: 'Comercio' };
const FAMILIAS: Record<string, FamiliaProducto> = {
  creditos: 'Créditos',
  tarjetas: 'Tarjetas',
  ahorro: 'Ahorro',
  comercios: 'Comercios',
};
const BENEFICIOS: Record<string, Beneficio> = {
  cero_interes: '0% Interés',
  cashback: 'Cashback',
  sin_cuota: 'Sin Cuota',
};
const ESTADOS: Record<string, string> = {
  nuevo: 'En estudio',
  contactado: 'Contactado',
  en_proceso: 'En proceso',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

// La base no guarda fotos: cada producto conocido usa una de assets/
const IMAGENES: Record<string, string> = {
  'banco-andino': 'libre-inversion',
  'fintech-luz': 'tarjeta-digital',
  'microcredito-ya': 'microcredito',
  'banco-verde': 'hipotecario',
  'tienda-mas': 'compra-ahora',
  'ahorro-plus': 'ahorro',
};

const LOGO_POR_DEFECTO = 'linear-gradient(135deg, #0f3d22 0%, #0a5c28 100%)';

/** Iniciales del aliado para el logo cuando la base no trae uno. */
function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join('');
}

/** "2026-11-25" → "25 de noviembre de 2026" */
function fechaLarga(texto: string): string {
  const [anio, mes, dia] = texto.split('-').map(Number);
  if (!anio || !mes || !dia) return texto;
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Plazos en meses que se ofrecen como botones, dentro del rango del producto. */
export function plazosPosibles(minimo: number, maximo: number): number[] {
  if (maximo <= 0) return [];
  const plazos = [3, 6, 12, 18, 24, 36, 48, 60, 84, 120, 240, 360].filter(
    (p) => p >= minimo && p <= maximo
  );
  if (!plazos.includes(maximo)) plazos.push(maximo);
  return plazos;
}

function aOferta(o: OfertaMid): Oferta {
  const imagen = IMAGENES[o.slug];
  return {
    id: o.id,
    slug: o.slug,
    aliado: o.aliado,
    descripcion: o.descripcion,
    meta: o.meta,
    logoBg: o.logo_fondo || LOGO_POR_DEFECTO,
    logoText: o.logo_texto || iniciales(o.aliado),
    imagen: imagen ? `assets/img/alianzas/${imagen}.webp` : undefined,
    ctaPrimaria: o.cta_primaria || 'Solicitar',
    ctaSecundaria: o.cta_secundaria || 'Conocer el producto',
    tipo: TIPOS[o.tipo] ?? 'Bancos',
    familia: FAMILIAS[o.familia] ?? 'Créditos',
    beneficio: BENEFICIOS[o.beneficio] ?? null,
    perfiles: (o.perfiles ?? []) as Perfil[],
    categoria: o.categoria,
    promesa: o.promesa || o.categoria,
    tasaDesde: o.tasa_desde,
    montoMaximo: o.monto_maximo,
    plazoMaximo: o.plazo_maximo,
    aprobacion: o.aprobacion,
    calificacion: o.calificacion,
    usuarios: o.usuarios,
    compatibilidad: o.compatibilidad,
    destacada: o.destacada,
    etiquetas: o.etiquetas ?? [],
    requisitos: o.requisitos ?? [],
    caracteristicas: o.caracteristicas ?? [],
    tarifas: o.tarifas ?? [],
  };
}

@Injectable({
  providedIn: 'root',
})
export class AlianzasService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private notificaciones = inject(NotificacionesService);

  /** Catálogo de productos de los aliados (GET /ofertas). */
  readonly ofertas = signal<Oferta[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  /** Solicitudes que ve el admin (GET /admin/solicitudes-credito). */
  readonly solicitudes = signal<Solicitud[]>([]);

  cargarOfertas(): void {
    this.cargando.set(true);
    this.error.set('');

    this.http.get<OfertaMid[]>(`${API_URL}/ofertas`).subscribe({
      next: (ofertas) => {
        this.ofertas.set(ofertas.map(aOferta));
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /** Ficha de un producto con todo lo que muestra la página de detalle. */
  obtenerFicha(id: number): Observable<FichaOferta> {
    return this.http.get<FichaMid>(`${API_URL}/ofertas/${id}`).pipe(
      map((f) => ({
        ...aOferta(f),
        montoMinimo: f.monto_minimo,
        plazoMinimo: f.plazo_minimo,
        documentos: f.documentos ?? [],
        preguntas: f.preguntas ?? [],
        relacionadas: (f.relacionadas ?? []).map((r) => ({
          id: r.id,
          categoria: r.categoria,
          tasaDesde: r.tasa_desde,
        })),
      }))
    );
  }

  /** Envía la solicitud de crédito del usuario. El MID valida monto, plazo y datos. */
  radicarSolicitud(datos: DatosSolicitud): Observable<SolicitudRadicada> {
    const cuerpo = {
      id_usuario: this.authService.obtenerUsuario()?.id,
      id_producto: datos.idProducto,
      monto: datos.monto,
      plazo_meses: datos.plazoMeses,
      nombre: datos.nombre,
      documento: datos.documento,
      correo: datos.correo,
      celular: datos.celular,
      ingresos: datos.ingresos,
      acepta_terminos: datos.aceptaTerminos,
    };

    return this.http.post<any>(`${API_URL}/solicitud-credito`, cuerpo).pipe(
      map((r) => {
        this.notificaciones.agregar({
          categoria: 'alianzas',
          titulo: 'Nueva solicitud de alianza',
          detalle: `${datos.nombre} solicitó ${r.producto}.`,
          ruta: '/admin/alianzas',
          nivel: 'info',
        });
        return {
          idSolicitud: r.id_solicitud,
          radicado: r.radicado,
          producto: r.producto,
          monto: r.monto,
          plazoMeses: r.plazo_meses,
          cuotaEstimada: r.cuota_estimada,
          estado: r.estado,
          asesor: r.asesor,
        };
      })
    );
  }

  /** Carga las solicitudes de crédito para el panel de administración. */
  cargarSolicitudesAdmin(): void {
    this.http.get<SolicitudAdminMid[]>(`${API_URL}/admin/solicitudes-credito`).subscribe({
      next: (lista) =>
        this.solicitudes.set(
          lista.map((s) => ({
            idSolicitud: s.id_solicitud,
            radicado: s.radicado,
            nombre: s.nombre,
            correo: s.correo,
            producto: s.producto,
            aliado: s.aliado,
            monto: s.monto,
            plazoMeses: s.plazo_meses,
            fecha: fechaLarga(s.fecha),
            estado: ESTADOS[s.estado] ?? s.estado,
          }))
        ),
      error: (error) => this.error.set(mensajeDeError(error)),
    });
  }
}
