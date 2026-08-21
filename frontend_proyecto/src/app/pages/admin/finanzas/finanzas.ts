import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMenuComponent } from '../admin-menu/admin-menu';
import { FinanzasService, Movimiento } from '../../../services/finanzas';

@Component({
  selector: 'app-admin-finanzas',
  imports: [CommonModule, FormsModule, AdminMenuComponent],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css',
})
export class AdminFinanzasComponent {
  constructor(public finanzasService: FinanzasService) {}

  editandoId: number | null = null;

  formMovimiento: Movimiento = this.formularioVacio();

  private formularioVacio(): Movimiento {
    return { id: 0, icono: '💵', categoria: '', fecha: '', monto: 0 };
  }

  editarMovimiento(movimiento: Movimiento): void {
    this.editandoId = movimiento.id;
    this.formMovimiento = { ...movimiento };
  }

  cancelarEdicion(): void {
    this.editandoId = null;
    this.formMovimiento = this.formularioVacio();
  }

  guardarMovimiento(): void {
    if (!this.formMovimiento.categoria.trim()) {
      return;
    }

    if (this.editandoId) {
      this.finanzasService.editarMovimiento(this.editandoId, this.formMovimiento);
    } else {
      this.formMovimiento.id = Date.now();
      this.finanzasService.agregarMovimiento(this.formMovimiento);
    }

    this.cancelarEdicion();
  }

  eliminarMovimiento(id: number): void {
    this.finanzasService.eliminarMovimiento(id);
    if (this.editandoId === id) {
      this.cancelarEdicion();
    }
  }

  formatearCOP(valor: number): string {
    return `$${valor.toLocaleString('es-CO')}`;
  }
}
