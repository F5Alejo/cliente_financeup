import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';
import { AuthService } from '../../../services/auth';
import {
  AlianzasService,
  Beneficio,
  FamiliaProducto,
  Oferta,
  Perfil,
} from '../../../services/alianzas';

type FiltroFamilia = 'Todos' | FamiliaProducto;

@Component({
  selector: 'app-alianzas',
  standalone: true,
  imports: [CommonModule, BandaSeccionComponent, IconComponent],
  templateUrl: './alianzas.html',
  styleUrl: './alianzas.css',
})
export class AlianzasComponent {
  private alianzasService = inject(AlianzasService);
  private router = inject(Router);
  private authService = inject(AuthService);

  // El catálogo viene del MID (GET /ofertas)
  readonly ofertas = this.alianzasService.ofertas;
  readonly cargando = this.alianzasService.cargando;
  readonly error = this.alianzasService.error;

  // Solicitudes que ya radicó el usuario (GET /solicitud-credito/usuario/:id)
  readonly misSolicitudes = this.alianzasService.misSolicitudes;
  readonly errorSolicitudes = this.alianzasService.errorSolicitudes;
  readonly conSesion = this.authService.estaAutenticado();

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.alianzasService.cargarOfertas();
    this.alianzasService.cargarMisSolicitudes();
  }

  /** Monto exacto en pesos, para lo que pidió el usuario. */
  formatPesos(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  }

  // ---------- Filtros ----------
  readonly familias: FiltroFamilia[] = ['Todos', 'Créditos', 'Tarjetas', 'Ahorro', 'Comercios'];
  readonly beneficios: Beneficio[] = ['0% Interés', 'Cashback', 'Sin Cuota'];
  readonly perfiles: Perfil[] = ['Score Alto', 'Historial Nuevo'];

  readonly familiaActiva = signal<FiltroFamilia>('Todos');
  readonly beneficioSeleccionado = signal<Beneficio | null>(null);
  readonly perfilSeleccionado = signal<Perfil | null>(null);
  readonly busqueda = signal('');

  seleccionarFamilia(familia: FiltroFamilia): void {
    this.familiaActiva.set(familia);
  }

  alternarBeneficio(beneficio: Beneficio): void {
    this.beneficioSeleccionado.set(
      this.beneficioSeleccionado() === beneficio ? null : beneficio
    );
  }

  alternarPerfil(perfil: Perfil): void {
    this.perfilSeleccionado.set(this.perfilSeleccionado() === perfil ? null : perfil);
  }

  limpiarFiltros(): void {
    this.familiaActiva.set('Todos');
    this.beneficioSeleccionado.set(null);
    this.perfilSeleccionado.set(null);
    this.busqueda.set('');
  }

  readonly hayFiltros = computed(
    () =>
      this.familiaActiva() !== 'Todos' ||
      this.beneficioSeleccionado() !== null ||
      this.perfilSeleccionado() !== null ||
      this.busqueda().trim() !== ''
  );

  // ---------- Listado ----------
  readonly productos = computed<Oferta[]>(() => {
    const texto = this.busqueda().toLowerCase().trim();
    const familia = this.familiaActiva();
    const beneficio = this.beneficioSeleccionado();
    const perfil = this.perfilSeleccionado();

    return this.ofertas()
      .filter((oferta) => {
        if (familia !== 'Todos' && oferta.familia !== familia) return false;
        if (beneficio && oferta.beneficio !== beneficio) return false;
        if (perfil && !oferta.perfiles.includes(perfil)) return false;
        if (!texto) return true;

        return (
          oferta.aliado.toLowerCase().includes(texto) ||
          oferta.categoria.toLowerCase().includes(texto) ||
          oferta.promesa.toLowerCase().includes(texto) ||
          oferta.descripcion.toLowerCase().includes(texto)
        );
      })
      .sort((a, b) => b.compatibilidad - a.compatibilidad);
  });

  /** La tabla comparativa solo aparece cuando hay una familia elegida con varios productos. */
  readonly comparables = computed<Oferta[]>(() => {
    const familia = this.familiaActiva();
    if (familia === 'Todos') return [];
    const productos = this.productos();
    return productos.length > 1 ? productos.slice(0, 3) : [];
  });

  conteoFamilia(familia: FiltroFamilia): number {
    if (familia === 'Todos') return this.ofertas().length;
    return this.ofertas().filter((o) => o.familia === familia).length;
  }

  // ---------- Cifras del encabezado ----------
  readonly totalAliados = computed(() => this.ofertas().length);

  readonly tasaMinima = computed(() => {
    const tasas = this.ofertas()
      .map((o) => o.tasaDesde)
      .filter((t) => t > 0);
    return tasas.length ? Math.min(...tasas) : 0;
  });

  /** Horizonte de la banda: las tasas de mayor a menor, invertidas, para que suba hasta la más baja
   *  (la última barra, la que se enciende). */
  readonly horizonteTasas = computed(() => {
    const tasas = this.ofertas().map((o) => o.tasaDesde).filter((t) => t > 0).sort((a, b) => b - a);
    return tasas.length >= 2 ? tasas.map((t) => -t) : null;
  });

  /** La tasa más baja entre los productos que se están comparando. */
  readonly tasaMasBajaComparable = computed(() => {
    const tasas = this.comparables().map((o) => o.tasaDesde).filter((t) => t > 0);
    return tasas.length ? Math.min(...tasas) : null;
  });

  readonly aprobacionRapida = computed(
    () =>
      this.ofertas().find((o) => o.aprobacion === 'Inmediata')?.aprobacion ??
      '10 minutos'
  );

  // ---------- Formato colombiano ----------
  formatTasa(tasa: number): string {
    if (tasa === 0) return '0%';
    return `${tasa.toString().replace('.', ',')}% E.A.`;
  }

  formatMonto(valor: number): string {
    if (valor === 0) return 'Sin tope';
    if (valor >= 1_000_000) return `$${(valor / 1_000_000).toString().replace('.', ',')} millones`;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  }

  formatPlazo(meses: number): string {
    if (meses === 0) return 'Sin plazo';
    if (meses >= 12 && meses % 12 === 0) return `Hasta ${meses / 12} años`;
    return `Hasta ${meses} meses`;
  }

  cuotaManejo(oferta: Oferta): string {
    return (
      oferta.tarifas.find((t) => t.concepto.toLowerCase().includes('cuota de manejo'))
        ?.valor ?? 'No aplica'
    );
  }

  // ---------- Navegación ----------
  verProducto(oferta: Oferta): void {
    this.router.navigate(['/alianzas/producto', oferta.id]);
  }

  solicitar(oferta: Oferta): void {
    this.router.navigate(['/alianzas/producto', oferta.id, 'solicitud']);
  }

  // ---------- Encabezado ----------
  verElegibles(): void {
    this.irAlCatalogo();
  }

  explorarTodo(): void {
    this.limpiarFiltros();
    this.irAlCatalogo();
  }

  private irAlCatalogo(): void {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
