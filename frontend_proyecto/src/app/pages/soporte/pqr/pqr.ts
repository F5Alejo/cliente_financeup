import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EstadoPqr, Pqr, PqrService } from '../../../services/pqr';
import { ToastService } from '../../../shared/services/toast';

type FiltroEstado = 'Todas' | EstadoPqr;

@Component({
  selector: 'app-pqr',
  imports: [CommonModule, FormsModule],
  templateUrl: './pqr.html',
  styleUrl: './pqr.css',
})
export class PqrComponent {
  constructor(
    private pqrService: PqrService,
    private toastService: ToastService,
    private router: Router
  ) {}

  // =========================
  // TEXTOS DEL COMPONENTE
  // =========================

  tituloPagina: string = 'Mis PQR';
  subtituloPagina: string =
    'Consulta el estado de tus peticiones, quejas y reclamos en un solo lugar.';
  placeholderBuscador: string = 'Buscar por título, número o estado';
  botonVerMas: string = 'Ver detalle';
  tituloCrearNuevo: string = 'Crear nueva PQR';
  textoCrearNuevo: string =
    'Radica una petición, queja o reclamo y haz seguimiento en tiempo real.';
  botonCrearNuevo: string = 'Radicar PQR';

  // =========================
  // BUSCADOR Y FILTROS
  // =========================

  searchText: string = '';
  filtroEstado: FiltroEstado = 'Todas';
  readonly estados: FiltroEstado[] = [
    'Todas',
    'Radicado',
    'En revisión',
    'Resuelto',
    'Rechazado',
  ];

  get pqrs(): Pqr[] {
    return this.pqrService.pqrs;
  }

  get filteredPqrs(): Pqr[] {
    const search = this.searchText.toLowerCase().trim();

    return this.pqrs.filter((pqr) => {
      if (this.filtroEstado !== 'Todas' && pqr.estado !== this.filtroEstado) {
        return false;
      }

      if (!search) return true;

      return (
        pqr.titulo.toLowerCase().includes(search) ||
        pqr.numero.includes(search) ||
        pqr.estado.toLowerCase().includes(search) ||
        pqr.categoria.toLowerCase().includes(search)
      );
    });
  }

  // =========================
  // RESUMEN
  // =========================

  get totalPqrs(): number {
    return this.pqrs.length;
  }

  get enRevision(): number {
    return this.pqrs.filter((pqr) => pqr.estado === 'En revisión').length;
  }

  get resueltas(): number {
    return this.pqrs.filter((pqr) => pqr.estado === 'Resuelto').length;
  }

  buscar(): void {
    // La lista ya se filtra de forma reactiva (ver filteredPqrs); esto solo da
    // feedback explícito al usuario cuando pulsa el botón de búsqueda.
    if (this.filteredPqrs.length === 0) {
      this.toastService.info('No se encontraron PQR con ese criterio.');
    }
  }

  seleccionarEstado(estado: FiltroEstado): void {
    this.filtroEstado = estado;
  }

  // Clase CSS del distintivo según el estado del ticket.
  claseEstado(estado: EstadoPqr): string {
    if (estado === 'Resuelto') return 'is-resuelto';
    if (estado === 'Rechazado') return 'is-rechazado';
    return 'is-revision';
  }

  clasePrioridad(prioridad: string): string {
    if (prioridad === 'Alta') return 'is-alta';
    if (prioridad === 'Baja') return 'is-baja';
    return 'is-media';
  }

  // =========================
  // ACCIONES
  // =========================

  verPqr(pqr: Pqr): void {
    this.router.navigate(['/ver-pqr', pqr.numero]);
  }

  crearNuevaPqr(): void {
    this.router.navigate(['/nuevo-pqr']);
  }
}
