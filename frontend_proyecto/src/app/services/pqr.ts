import { Injectable } from '@angular/core';

export interface Pqr {
  titulo: string;
  numero: string;
  estado: string;
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
      estado: 'En revisión'
    },
    {
      titulo: 'Bug en la plataforma',
      numero: '1516655',
      estado: 'En revisión'
    }
  ];

  agregarPqr(pqr: Pqr): void {
    this.pqrs.push(pqr);
  }

  cambiarEstado(numero: string, nuevoEstado: string): void {
    const pqr = this.pqrs.find((p) => p.numero === numero);
    if (pqr) {
      pqr.estado = nuevoEstado;
    }
  }

  eliminarPqr(numero: string): void {
    this.pqrs = this.pqrs.filter((p) => p.numero !== numero);
  }
}
