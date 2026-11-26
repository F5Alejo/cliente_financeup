import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlianzasService, FamiliaProducto, Oferta, TipoAliado } from '../../../services/alianzas';
import { MonedaPipe } from '../../../pipes/moneda.pipe';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio';
import { IconComponent } from '../../../shared/components/icon/icon';
import { KpiComponent } from '../../../shared/components/kpi/kpi';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { PaginacionComponent } from '../../../shared/components/paginacion/paginacion';
import { AccionMenu, RowMenuComponent } from '../../../shared/components/row-menu/row-menu';
import { ToastService } from '../../../shared/services/toast';
import { crearPaginador, enlazarConShell, normalizarTexto } from '../../../shared/utils/lista';

type Vista = 'ofertas' | 'solicitudes';

interface ModalOferta {
  tipo: 'formulario' | 'eliminar';
  oferta: Oferta | null;
}

const MENSAJES_ERROR: Record<string, string> = {
  aliado: 'Escribe el nombre del aliado.',
  ctaPrimaria: 'Indica el texto del botón principal.',
};

@Component({
  selector: 'app-admin-alianzas',
  imports: [FormsModule, ReactiveFormsModule, MonedaPipe, IconComponent, KpiComponent, ModalComponent, PaginacionComponent, EstadoVacioComponent, RowMenuComponent],
  templateUrl: './alianzas.html',
  styleUrl: './alianzas.css',
})
export class AdminAlianzasComponent {
  private alianzasService = inject(AlianzasService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder).nonNullable;

  readonly familias: FamiliaProducto[] = ['Créditos', 'Tarjetas', 'Ahorro', 'Comercios'];
  readonly tipos: TipoAliado[] = ['Bancos', 'Fintech', 'Comercio'];
  readonly esqueletos = [1, 2, 3, 4];

  // Ofertas y solicitudes reales del MID
  ofertas = this.alianzasService.ofertas;
  solicitudes = this.alianzasService.solicitudes;
  cargando = this.alianzasService.cargando;
  vista = signal<Vista>('ofertas');
  busqueda = signal('');
  filtroFamilia = signal<FamiliaProducto | ''>('');
  modal = signal<ModalOferta | null>(null);
  errorModal = signal('');

  formulario = this.fb.group({
    aliado: ['', Validators.required],
    logoText: [''],
    descripcion: [''],
    meta: [''],
    familia: ['Créditos' as FamiliaProducto],
    tipo: ['Bancos' as TipoAliado],
    ctaPrimaria: ['Solicitar', Validators.required],
    ctaSecundaria: [''],
    destacada: [false],
  });

  totalOfertas = computed(() => this.ofertas().length);
  destacadas = computed(() => this.ofertas().filter((o) => o.destacada).length);
  enEstudio = computed(() => this.solicitudes().filter((s) => s.estado === 'En estudio').length);
  usuariosTotales = computed(() => this.ofertas().reduce((suma, o) => suma + o.usuarios, 0));

  filtradas = computed(() => {
    const texto = normalizarTexto(this.busqueda().trim());
    const familia = this.filtroFamilia();
    return this.ofertas().filter(
      (o) =>
        (!texto || normalizarTexto(`${o.aliado} ${o.descripcion} ${o.categoria}`).includes(texto)) &&
        (!familia || o.familia === familia)
    );
  });

  paginador = crearPaginador(() => this.filtradas().length);
  filas = computed(() =>
    this.paginador.recortar(this.filtradas()).map((oferta) => ({
      oferta,
      acciones: [
        { id: 'editar', etiqueta: 'Editar', icono: 'pencil' },
        {
          id: 'destacar',
          etiqueta: oferta.destacada ? 'Quitar de destacadas' : 'Marcar como destacada',
          icono: 'shield-check',
        },
        { id: 'eliminar', etiqueta: 'Eliminar', icono: 'trash', peligro: true, separador: true },
      ] as AccionMenu[],
    }))
  );

  constructor() {
    this.alianzasService.cargarOfertas();
    this.alianzasService.cargarSolicitudesAdmin();

    enlazarConShell(
      (texto) => {
        this.vista.set('ofertas');
        this.filtrar(this.busqueda, texto);
      },
      () => this.abrirFormulario()
    );
  }

  filtrar<T>(senal: { set(valor: T): void }, valor: T): void {
    senal.set(valor);
    this.paginador.reiniciar();
  }

  hayFiltros(): boolean {
    return !!(this.busqueda().trim() || this.filtroFamilia());
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroFamilia.set('');
    this.paginador.reiniciar();
  }

  alElegirAccion(id: string, oferta: Oferta): void {
    if (id === 'editar') this.abrirFormulario(oferta);
    if (id === 'eliminar') this.modal.set({ tipo: 'eliminar', oferta });
    if (id === 'destacar') {
      this.toastService.info('Destacar ofertas se conecta con el backend en el módulo de administración.');
    }
  }

  abrirFormulario(oferta: Oferta | null = null): void {
    this.errorModal.set('');
    this.formulario.reset({
      aliado: oferta?.aliado ?? '',
      logoText: oferta?.logoText ?? '',
      descripcion: oferta?.descripcion ?? '',
      meta: oferta?.meta ?? '',
      familia: oferta?.familia ?? 'Créditos',
      tipo: oferta?.tipo ?? 'Bancos',
      ctaPrimaria: oferta?.ctaPrimaria ?? 'Solicitar',
      ctaSecundaria: oferta?.ctaSecundaria ?? '',
      destacada: oferta?.destacada ?? false,
    });
    this.modal.set({ tipo: 'formulario', oferta });
  }

  cerrarModal(): void {
    this.modal.set(null);
  }

  errorDe(campo: 'aliado' | 'ctaPrimaria'): string {
    const control = this.formulario.controls[campo];
    return control.touched && control.invalid ? MENSAJES_ERROR[campo] : '';
  }

  iniciales(oferta: Oferta): string {
    return oferta.logoText || oferta.aliado.slice(0, 2).toUpperCase();
  }

  guardar(): void {
    if (this.formulario.invalid || !this.formulario.controls.aliado.value.trim()) {
      this.formulario.markAllAsTouched();
      this.errorModal.set('Revisa los campos marcados.');
      return;
    }

    // El MID todavía no tiene rutas para crear o editar ofertas
    this.toastService.info('Crear y editar ofertas se conecta con el backend en el módulo de administración.');
    this.cerrarModal();
  }

  confirmarEliminacion(): void {
    this.toastService.info('Eliminar ofertas se conecta con el backend en el módulo de administración.');
    this.cerrarModal();
  }
}
