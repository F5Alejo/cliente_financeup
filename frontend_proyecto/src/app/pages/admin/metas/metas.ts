    import { Component, signal } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { FormsModule } from '@angular/forms';
    import { AdminMenuComponent } from '../admin-menu/admin-menu';
    import { MetasService, Meta } from '../../../services/metas';
    import { ToastService } from '../../../shared/services/toast';

    @Component({
    selector: 'app-admin-metas',
    imports: [CommonModule, FormsModule, AdminMenuComponent],
    templateUrl: './metas.html',
    styleUrl: './metas.css',
    })
    export class AdminMetasComponent {
    constructor(
        public metasService: MetasService,
        private toastService: ToastService
    ) {}

    editandoId: number | null = null;
    busqueda = signal('');

    formMeta: Meta = this.formularioVacio();

    private formularioVacio(): Meta {
        return { id: 0, nombre: '', icono: '🎯', porcentaje: 0, actual: 0, objetivo: 0, cumplida: false };
    }

    get metasFiltradas(): Meta[] {
        const termino = this.busqueda().trim().toLowerCase();
        const todas = this.metasService.metas;
        if (!termino) return todas;
        return todas.filter((m) => m.nombre.toLowerCase().includes(termino));
    }

    get totalMetas(): number {
        return this.metasService.metas.length;
    }

    get metasCumplidas(): number {
        return this.metasService.metas.filter((m) => m.cumplida).length;
    }

    get totalAhorrado(): number {
        return this.metasService.metas.reduce((suma, m) => suma + m.actual, 0);
    }

    actualizarBusqueda(valor: string): void {
        this.busqueda.set(valor);
    }

    editarMeta(meta: Meta): void {
        this.editandoId = meta.id;
        this.formMeta = { ...meta };
    }

    cancelarEdicion(): void {
        this.editandoId = null;
        this.formMeta = this.formularioVacio();
    }

    private calcularPorcentaje(actual: number, objetivo: number): number {
        return objetivo > 0 ? Math.min(100, Math.round((actual / objetivo) * 100)) : 0;
    }

    guardarMeta(): void {
        const nombre = this.formMeta.nombre.trim();
        if (!nombre || !this.formMeta.objetivo) {
        this.toastService.info('Completa el nombre y un monto objetivo válido.');
        return;
        }

        this.formMeta.porcentaje = this.calcularPorcentaje(this.formMeta.actual, this.formMeta.objetivo);
        this.formMeta.cumplida = this.formMeta.actual >= this.formMeta.objetivo;

        if (this.editandoId) {
        this.metasService.editarMeta(this.editandoId, this.formMeta);
        this.toastService.success('Meta actualizada correctamente.');
        } else {
        this.metasService.agregarMeta({
            nombre,
            icono: this.formMeta.icono || '🎯',
            actual: this.formMeta.actual,
            objetivo: this.formMeta.objetivo,
        });
        this.toastService.success('Meta agregada correctamente.');
        }

        this.cancelarEdicion();
    }

    eliminarMeta(id: number): void {
        const meta = this.metasService.metas.find((m) => m.id === id);
        const confirmado = confirm(`¿Eliminar la meta "${meta?.nombre}"? Esta acción no se puede deshacer.`);
        if (!confirmado) return;

        this.metasService.eliminarMeta(id);
        this.toastService.info('Meta eliminada.');
        if (this.editandoId === id) {
        this.cancelarEdicion();
        }
    }

    formatearCOP(valor: number): string {
        return `$${valor.toLocaleString('es-CO')}`;
    }
    }