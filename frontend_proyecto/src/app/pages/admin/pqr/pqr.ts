import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMenuComponent } from '../admin-menu/admin-menu';
import { PqrService } from '../../../services/pqr';

@Component({
  selector: 'app-admin-pqr',
  imports: [CommonModule, FormsModule, AdminMenuComponent],
  templateUrl: './pqr.html',
  styleUrl: './pqr.css',
})
export class AdminPqrComponent {
  constructor(public pqrService: PqrService) {}

  estados = ['Radicado', 'En revisión', 'Resuelto', 'Rechazado'];

  cambiarEstado(numero: string, event: Event): void {
    const nuevoEstado = (event.target as HTMLSelectElement).value;
    this.pqrService.cambiarEstado(numero, nuevoEstado);
  }

  eliminarPqr(numero: string): void {
    this.pqrService.eliminarPqr(numero);
  }
}
