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

    /** Filtro rápido por nivel de riesgo (mayor control sobre el campo "riesgo") */
    riesgoFiltro = signal<'Todos' | 'Bajo' | 'Medio' | 'Alto'>('Todos');

    /** Orden de la tabla: qué columna y en qué sentido (mayor control sobre cada campo) */
    columnaOrden = signal<'nombre' | 'monto' | 'rendimiento' | 'riesgo' | 'duracion' | null>(null);
    ordenAscendente = signal(true);

    formInversion: Inversion = this.formularioVacio();

    private formularioVacio(): Inversion {
        return { id: 0, nombre: '', monto: 0, rendimiento: 0, riesgo: 'Bajo', duracion: '' };
    }

    get inversionesFiltradas(): Inversion[] {
        const termino = this.busqueda().trim().toLowerCase();
        let lista = this.inversionesService.inversiones;

        if (termino) lista = lista.filter((i) => i.nombre.toLowerCase().includes(termino));
        if (this.riesgoFiltro() !== 'Todos') lista = lista.filter((i) => i.riesgo === this.riesgoFiltro());

        const columna = this.columnaOrden();
        if (columna) {
            lista = [...lista].sort((a, b) => {
                const valA = a[columna];
                const valB = b[columna];
                const comparacion = typeof valA === 'number' ? valA - (valB as number) : String(valA).localeCompare(String(valB));
                return this.ordenAscendente() ? comparacion : -comparacion;
            });
        }

        return lista;
    }

    get totalInvertido(): number {
        return this.inversionesService.inversiones.reduce((suma, i) => suma + i.monto, 0);
    }

    get totalRendimiento(): number {
        return this.inversionesService.inversiones.reduce((suma, i) => suma + i.rendimiento, 0);
    }

    /** Cuánto dinero hay invertido en cada nivel de riesgo */
    totalPorRiesgo(riesgo: 'Bajo' | 'Medio' | 'Alto'): number {
        return this.inversionesService.inversiones
            .filter((i) => i.riesgo === riesgo)
            .reduce((suma, i) => suma + i.monto, 0);
    }

    /** Rendimiento de una inversión como porcentaje de lo invertido */
    rendimientoPorcentaje(inv: Inversion): number {
        return inv.monto > 0 ? Math.round((inv.rendimiento / inv.monto) * 1000) / 10 : 0;
    }

    actualizarBusqueda(valor: string): void {
        this.busqueda.set(valor);
    }

    filtrarPorRiesgo(riesgo: string): void {
        this.riesgoFiltro.set(riesgo as 'Todos' | 'Bajo' | 'Medio' | 'Alto');
    }

    ordenarPor(columna: 'nombre' | 'monto' | 'rendimiento' | 'riesgo' | 'duracion'): void {
        if (this.columnaOrden() === columna) {
            this.ordenAscendente.update((v) => !v);
        } else {
            this.columnaOrden.set(columna);
            this.ordenAscendente.set(true);
        }
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