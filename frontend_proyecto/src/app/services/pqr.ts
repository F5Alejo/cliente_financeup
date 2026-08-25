import { Injectable } from '@angular/core';

export type EstadoPqr = 'En revisión' | 'Resuelto' | 'Rechazado' | 'Radicado';
export type PrioridadPqr = 'Alta' | 'Media' | 'Baja';

export interface Pqr {
  titulo: string;
  numero: string;
  estado: EstadoPqr;

  // Datos visibles en la tarjeta
  tipo: string;
  categoria: string;
  descripcion: string;
  prioridad: PrioridadPqr;
  fechaCreacion: string;
  ultimaActualizacion: string;
  asesor: string;
  respuestas: number;
  adjuntos: number;
  progreso: number;

  // Datos usados en el detalle (ver-pqr)
  usuario: string;
  archivosAdjuntos: string[];
  mensajeRespuesta: string;
}

@Injectable({
  providedIn: 'root'
})
export class PqrService {
  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
  pqrs: Pqr[] = [
    {
      titulo: 'Queja asesor',
      numero: '1121313131',
      estado: 'En revisión',
      tipo: 'Queja',
      categoria: 'Atención al cliente',
      descripcion:
        'El asesor no resolvió mi solicitud de bloqueo de tarjeta en el tiempo prometido.',
      prioridad: 'Alta',
      fechaCreacion: '12 ago 2025',
      ultimaActualizacion: 'Hace 2 días',
      asesor: 'Camila Rojas',
      respuestas: 3,
      adjuntos: 1,
      progreso: 60,
      usuario: 'Harold Arciniegas',
      archivosAdjuntos: ['evidencia_llamada.jpg'],
      mensajeRespuesta:
        'Estamos revisando tu caso, en caso de alguna novedad se te notificará por este mismo medio.',
    },
    {
      titulo: 'Bug en la plataforma',
      numero: '1516655',
      estado: 'En revisión',
      tipo: 'Petición',
      categoria: 'Plataforma',
      descripcion:
        'El gráfico de metas no carga los datos del último mes desde el celular.',
      prioridad: 'Media',
      fechaCreacion: '19 ago 2025',
      ultimaActualizacion: 'Hace 6 horas',
      asesor: 'Soporte técnico',
      respuestas: 1,
      adjuntos: 2,
      progreso: 35,
      usuario: 'Harold Arciniegas',
      archivosAdjuntos: ['captura_error_1.png', 'captura_error_2.png'],
      mensajeRespuesta:
        'Nuestro equipo técnico ya está revisando el problema reportado. Te avisaremos apenas tengamos novedades.',
    },
    {
      titulo: 'Cobro duplicado en transferencia',
      numero: '1783402',
      estado: 'Resuelto',
      tipo: 'Reclamo',
      categoria: 'Movimientos y pagos',
      descripcion:
        'Se descontó dos veces el mismo pago programado. Ya fue reintegrado a la cuenta.',
      prioridad: 'Alta',
      fechaCreacion: '02 ago 2025',
      ultimaActualizacion: 'Hace 9 días',
      asesor: 'Andrés Peña',
      respuestas: 5,
      adjuntos: 3,
      progreso: 100,
      usuario: 'Harold Arciniegas',
      archivosAdjuntos: [
        'comprobante_transferencia.pdf',
        'soporte_banco.pdf',
        'captura_movimientos.png',
      ],
      mensajeRespuesta:
        'Confirmamos el reintegro del cobro duplicado a tu cuenta. Tu caso ha sido cerrado exitosamente.',
    },
  ];

  agregarPqr(pqr: Pqr): void {
    this.pqrs.unshift(pqr);
  }

  cambiarEstado(numero: string, nuevoEstado: string): void {
    const pqr = this.pqrs.find((p) => p.numero === numero);
    if (pqr) {
      pqr.estado = nuevoEstado as EstadoPqr;
      pqr.progreso = nuevoEstado === 'Resuelto' ? 100 : pqr.progreso;
    }
  }

  eliminarPqr(numero: string): void {
    this.pqrs = this.pqrs.filter((p) => p.numero !== numero);
  }
}