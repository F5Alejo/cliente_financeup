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

    /** Filtro rápido por estado (mayor control sobre el campo "cumplida") */
    estadoFiltro = signal<'Todas' | 'Cumplidas' | 'En progreso'>('Todas');

    /** Orden de la tabla: qué columna y en qué sentido */
    columnaOrden = signal<'nombre' | 'actual' | 'objetivo' | 'porcentaje' | null>(null);
    ordenAscendente = signal(true);

    formMeta: Meta = this.formularioVacio();

    private formularioVacio(): Meta {
        return { id: 0, nombre: '', icono: '🎯', porcentaje: 0, actual: 0, objetivo: 0, cumplida: false };
    }

    get metasFiltradas(): Meta[] {
        const termino = this.busqueda().trim().toLowerCase();
        let lista = this.metasService.metas;

        if (termino) lista = lista.filter((m) => m.nombre.toLowerCase().includes(termino));
        if (this.estadoFiltro() === 'Cumplidas') lista = lista.filter((m) => m.cumplida);
        if (this.estadoFiltro() === 'En progreso') lista = lista.filter((m) => !m.cumplida);

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

    /** Cuánto le falta a una meta para completarse */
    faltante(meta: Meta): number {
        return Math.max(0, meta.objetivo - meta.actual);
    }

    filtrarPorEstado(estado: string): void {
        this.estadoFiltro.set(estado as 'Todas' | 'Cumplidas' | 'En progreso');
    }

    ordenarPor(columna: 'nombre' | 'actual' | 'objetivo' | 'porcentaje'): void {
        if (this.columnaOrden() === columna) {
            this.ordenAscendente.update((v) => !v);
        } else {
            this.columnaOrden.set(columna);
            this.ordenAscendente.set(true);
        }
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