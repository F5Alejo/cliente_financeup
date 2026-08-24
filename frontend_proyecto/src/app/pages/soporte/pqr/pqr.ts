import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PqrService, Pqr } from '../../../services/pqr';
import { ToastService } from '../../../shared/services/toast';

@Component({
  selector: 'app-pqr',
  imports: [CommonModule, FormsModule],
  templateUrl: './pqr.html',
  styleUrl: './pqr.css',
})
export class PqrComponent {
  constructor(
    private pqrService: PqrService,
    private toastService: ToastService
  ) {}

  get pqrs() {
    return this.pqrService.pqrs;
  }

  // =========================
  // TEXTOS DEL COMPONENTE
  // =========================

  tituloPagina: string = 'Mis PQR';

  placeholderBuscador: string = 'Buscar PQR';

  botonVerMas: string = 'Ver Mas';

  tituloCrearNuevo: string = 'Crear Nuevo';

  botonCrearNuevo: string = 'Crear Nuevo';

  botonAgregar: string = '+';


  // =========================
  // BUSCADOR
  // =========================

  searchText: string = '';


  // =========================
  // FILTRAR PQR
  // =========================

  get filteredPqrs() {

    const search = this.searchText
      .toLowerCase()
      .trim();

    if (!search) {
      return this.pqrs;
    }

    return this.pqrs.filter(pqr =>
      pqr.titulo.toLowerCase().includes(search) ||
      pqr.numero.includes(search) ||
      pqr.estado.toLowerCase().includes(search)
    );
  }

  buscar(): void {
    // La lista ya se filtra de forma reactiva (ver filteredPqrs); esto solo da
    // feedback explícito al usuario cuando pulsa el botón de búsqueda.
    if (this.filteredPqrs.length === 0) {
      this.toastService.info('No se encontraron PQR con ese criterio.');
    }
  }


  // =========================
  // ACCIONES
  // =========================

  verPqr(pqr: Pqr): void {
    this.toastService.info(`${pqr.titulo} · N° ${pqr.numero} · Estado: ${pqr.estado}`);
  }

  crearNuevaPqr(): void {
    const numero = Math.floor(1000000 + Math.random() * 9000000).toString();
    this.pqrService.agregarPqr({
      titulo: 'Nueva PQR',
      numero,
      estado: 'En revisión',
    });
    this.toastService.success('PQR creada correctamente.');
  }
}
