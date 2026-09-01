import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMenuComponent } from '../admin-menu/admin-menu';
import { FinanzasService, Movimiento } from '../../../services/finanzas';
import { ToastService } from '../../../shared/services/toast';

@Component({
  selector: 'app-admin-finanzas',
  imports: [CommonModule, FormsModule, AdminMenuComponent],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css',
})
export class AdminFinanzasComponent {
  constructor(
    public finanzasService: FinanzasService,
    private toastService: ToastService
  ) {
    console.log('Formulario Movimiento:', this.formularioVacio());
  }

  editandoId: number | null = null;
  busqueda = signal('');

  formMovimiento: Movimiento = this.formularioVacio();

  private formularioVacio(): Movimiento {
    return { id: 0, fecha: '', concepto: '', categoria: '', tipo: 'gasto', valor: 0 };
  }

  get movimientosFiltrados(): Movimiento[] {
    const termino = this.busqueda().trim().toLowerCase();
    const todos = this.finanzasService.movimientos;
    if (!termino) return todos;
    return todos.filter(
      (m) => m.categoria.toLowerCase().includes(termino) || m.concepto.toLowerCase().includes(termino)
    );
  }

  get totalIngresos(): number {
    return this.finanzasService.movimientos
      .filter((m) => m.tipo === 'ingreso')
      .reduce((suma, m) => suma + m.valor, 0);
  }

  get totalGastos(): number {
    return this.finanzasService.movimientos
      .filter((m) => m.tipo === 'gasto')
      .reduce((suma, m) => suma + m.valor, 0);
  }

  get balanceNeto(): number {
    return this.totalIngresos - this.totalGastos;
  }

  actualizarBusqueda(valor: string): void {
    this.busqueda.set(valor);
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
    const concepto = this.formMovimiento.concepto.trim();
    const categoria = this.formMovimiento.categoria.trim();

    if (!concepto || !categoria || !this.formMovimiento.fecha.trim() || !this.formMovimiento.valor || this.formMovimiento.valor <= 0) {
      this.toastService.info('Completa concepto, categoría, fecha y un valor mayor a 0.');
      return;
    }

    const datos = {
      fecha: this.formMovimiento.fecha,
      concepto,
      categoria,
      tipo: this.formMovimiento.tipo,
      valor: this.formMovimiento.valor,
    };

    if (this.editandoId) {
      this.finanzasService.editarMovimiento(this.editandoId, datos);
      this.toastService.success('Movimiento actualizado correctamente.');
    } else {
      this.finanzasService.agregarMovimiento(datos);
      this.toastService.success('Movimiento agregado correctamente.');
    }

    this.cancelarEdicion();
  }

  eliminarMovimiento(id: number): void {
    const movimiento = this.finanzasService.movimientos.find((m) => m.id === id);
    const confirmado = confirm(`¿Eliminar el movimiento "${movimiento?.concepto}"? Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    this.finanzasService.eliminarMovimiento(id);
    this.toastService.info('Movimiento eliminado.');
    if (this.editandoId === id) {
      this.cancelarEdicion();
    }
  }

  formatearCOP(valor: number): string {
    return `$${valor.toLocaleString('es-CO')}`;
  }
}
