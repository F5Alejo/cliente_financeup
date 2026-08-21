import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PqrService } from '../../../services/pqr';

@Component({
  selector: 'app-pqr',
  imports: [CommonModule, FormsModule],
  templateUrl: './pqr.html',
  styleUrl: './pqr.css',
})
export class PqrComponent {
  constructor(private pqrService: PqrService) {}

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


  // =========================
  // ACCIONES
  // =========================

  verPqr(pqr: any): void {
    console.log('PQR seleccionada:', pqr);
  }

  crearNuevaPqr(): void {
    console.log('Crear nueva PQR');
  }
}