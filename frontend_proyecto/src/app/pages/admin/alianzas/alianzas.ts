import { Component, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlianzasService, DatosOferta, FamiliaProducto, Oferta } from '../../../services/alianzas';
import { mensajeDeError } from '../../../services/api';
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

type CampoConError = 'idAliado' | 'categoria' | 'tasaDesde' | 'montoMaximo' | 'ctaPrimaria';

const MENSAJES_ERROR: Record<CampoConError, string> = {
  idAliado: 'Elige el aliado.',
  categoria: 'Escribe el nombre del producto (mínimo 3 letras).',
  tasaDesde: 'La tasa va entre 0 y 100.',
  montoMaximo: 'El monto máximo debe ser mayor a 0.',
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
  readonly esqueletos = [1, 2, 3, 4];

  // Ofertas y solicitudes reales del MID
  ofertas = this.alianzasService.ofertas;
  solicitudes = this.alianzasService.solicitudes;
  aliados = this.alianzasService.aliados;
  cargando = this.alianzasService.cargando;
  enviando = signal(false);
  vista = signal<Vista>('ofertas');
  busqueda = signal('');
  filtroFamilia = signal<FamiliaProducto | ''>('');
  modal = signal<ModalOferta | null>(null);
  errorModal = signal('');

  formulario = this.fb.group({
    idAliado: [0, Validators.min(1)],
    categoria: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    familia: ['Créditos' as FamiliaProducto],
    tasaDesde: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    montoMinimo: [0, Validators.min(0)],
    montoMaximo: [0, [Validators.required, Validators.min(1)]],
    plazoMinimo: [0, Validators.min(0)],
    plazoMaximo: [0, Validators.min(0)],
    aprobacion: [''],
    meta: [''],
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
        { id: 'eliminar', etiqueta: 'Retirar de la vitrina', icono: 'trash', peligro: true, separador: true },
      ] as AccionMenu[],
    }))
  );

  constructor() {
    this.alianzasService.cargarOfertas();
    this.alianzasService.cargarSolicitudesAdmin();
    this.alianzasService.cargarAliados();

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
    if (id === 'eliminar') {
      this.errorModal.set('');
      this.modal.set({ tipo: 'eliminar', oferta });
    }
    if (id === 'destacar') this.cambiarDestacada(oferta);
  }

  /** Marca o quita la oferta de destacadas: se manda la misma oferta con ese dato cambiado. */
  cambiarDestacada(oferta: Oferta): void {
    const datos = { ...this.datosDe(oferta), destacada: !oferta.destacada };
    this.alianzasService.guardarOferta(datos, oferta.id).subscribe({
      next: () =>
        this.toastService.success(datos.destacada ? 'La oferta ahora es destacada.' : 'La oferta ya no es destacada.'),
      error: (error) => this.toastService.error(mensajeDeError(error)),
    });
  }

  /** Los datos que tiene una oferta, en el formato del formulario. */
  datosDe(oferta: Oferta | null): DatosOferta {
    return {
      idAliado: oferta?.idAliado ?? 0,
      categoria: oferta?.categoria ?? '',
      descripcion: oferta?.descripcion ?? '',
      familia: oferta?.familia ?? 'Créditos',
      tasaDesde: oferta?.tasaDesde ?? 0,
      montoMinimo: oferta?.montoMinimo ?? 0,
      montoMaximo: oferta?.montoMaximo ?? 0,
      plazoMinimo: oferta?.plazoMinimo ?? 0,
      plazoMaximo: oferta?.plazoMaximo ?? 0,
      aprobacion: oferta?.aprobacion ?? '',
      meta: oferta?.meta ?? '',
      ctaPrimaria: oferta?.ctaPrimaria ?? 'Solicitar',
      ctaSecundaria: oferta?.ctaSecundaria ?? '',
      destacada: oferta?.destacada ?? false,
    };
  }

  abrirFormulario(oferta: Oferta | null = null): void {
    this.errorModal.set('');
    this.formulario.reset(this.datosDe(oferta));
    this.modal.set({ tipo: 'formulario', oferta });
  }

  cerrarModal(): void {
    this.modal.set(null);
  }

  errorDe(campo: CampoConError): string {
    const control = this.formulario.controls[campo];
    return control.touched && control.invalid ? MENSAJES_ERROR[campo] : '';
  }

  iniciales(oferta: Oferta): string {
    return oferta.logoText || oferta.aliado.slice(0, 2).toUpperCase();
  }

  guardar(): void {
    const valores = this.formulario.getRawValue();

    if (this.formulario.invalid || !valores.categoria.trim()) {
      this.formulario.markAllAsTouched();
      this.errorModal.set('Revisa los campos marcados.');
      return;
    }

    if (valores.montoMinimo > valores.montoMaximo || valores.plazoMinimo > valores.plazoMaximo) {
      this.errorModal.set('El mínimo no puede ser mayor que el máximo (monto o plazo).');
      return;
    }

    const oferta = this.modal()?.oferta;
    this.ejecutar(
      this.alianzasService.guardarOferta(valores, oferta?.id),
      oferta ? 'Oferta actualizada.' : 'Oferta creada. Ya se ve en la vitrina de Alianzas.'
    );
  }

  confirmarEliminacion(): void {
    const oferta = this.modal()?.oferta;
    if (!oferta) return;
    this.ejecutar(this.alianzasService.retirarOferta(oferta.id), `Se retiró la oferta de ${oferta.aliado}.`);
  }

  /** Manda la petición; si sale bien cierra el modal, si no deja el error del MID en el modal. */
  private ejecutar(peticion: Observable<unknown>, exito: string): void {
    this.enviando.set(true);
    this.errorModal.set('');
    peticion.subscribe({
      next: () => {
        this.enviando.set(false);
        this.toastService.success(exito);
        this.cerrarModal();
      },
      error: (error) => {
        this.enviando.set(false);
        this.errorModal.set(mensajeDeError(error));
      },
    });
  }
}
