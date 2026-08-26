import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMenuComponent } from '../admin-menu/admin-menu';
import { InversionesService, Inversion } from '../../../services/inversiones';
import { ToastService } from '../../../shared/services/toast';

    @Component({
        selector: 'app-admin-inversiones',
    imports: [CommonModule, FormsModule, AdminMenuComponent],
    templateUrl: './inversiones.html',
    styleUrl: './inversiones.css',
    })
    export class AdminInversionesComponent {
    constructor(
        public inversionesService: InversionesService,
        private toastService: ToastService
    ) {}

    editandoId: number | null = null;
    busqueda = signal('');

    formInversion: Inversion = this.formularioVacio();

    private formularioVacio(): Inversion {
        return { id: 0, nombre: '', monto: 0, rendimiento: 0, riesgo: 'Bajo', duracion: '' };
    }

    get inversionesFiltradas(): Inversion[] {
        const termino = this.busqueda().trim().toLowerCase();
        const todas = this.inversionesService.inversiones;
        if (!termino) return todas;
        return todas.filter((i) => i.nombre.toLowerCase().includes(termino));
    }

    get totalInvertido(): number {
        return this.inversionesService.inversiones.reduce((suma, i) => suma + i.monto, 0);
    }

    get totalRendimiento(): number {
        return this.inversionesService.inversiones.reduce((suma, i) => suma + i.rendimiento, 0);
    }

    get inversionesAltoRiesgo(): number {
        return this.inversionesService.inversiones.filter((i) => i.riesgo === 'Alto').length;
    }

    actualizarBusqueda(valor: string): void {
        this.busqueda.set(valor);
    }

    editarInversion(inversion: Inversion): void {
        this.editandoId = inversion.id;
        this.formInversion = { ...inversion };
    }

    cancelarEdicion(): void {
        this.editandoId = null;
        this.formInversion = this.formularioVacio();
    }

    guardarInversion(): void {
        const nombre = this.formInversion.nombre.trim();
        if (!nombre || !this.formInversion.duracion.trim() || !this.formInversion.monto) {
        this.toastService.info('Completa nombre, duración y un monto válido.');
        return;
        }

        if (this.editandoId) {
        this.inversionesService.editarInversion(this.editandoId, this.formInversion);
        this.toastService.success('Inversión actualizada correctamente.');
        } else {
        this.formInversion.id = Date.now();
        this.inversionesService.agregarInversion(this.formInversion);
        this.toastService.success('Inversión agregada correctamente.');
        }

        this.cancelarEdicion();
    }

    eliminarInversion(id: number): void {
        const inversion = this.inversionesService.inversiones.find((i) => i.id === id);
        const confirmado = confirm(`¿Eliminar la inversión "${inversion?.nombre}"? Esta acción no se puede deshacer.`);
        if (!confirmado) return;

        this.inversionesService.eliminarInversion(id);
        this.toastService.info('Inversión eliminada.');
        if (this.editandoId === id) {
        this.cancelarEdicion();
        }
    }

    formatearCOP(valor: number): string {
        return `$${valor.toLocaleString('es-CO')}`;
    }
    }