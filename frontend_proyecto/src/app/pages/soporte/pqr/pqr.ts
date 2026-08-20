import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pqr',
  imports: [CommonModule, FormsModule],
  templateUrl: './pqr.html',
  styleUrl: './pqr.css',
})
export class PqrComponent {

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
  // PQR QUEMADAS
  // =========================

  pqrs = [
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