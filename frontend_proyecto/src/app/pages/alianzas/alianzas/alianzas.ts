import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  imports: [CommonModule],
  templateUrl: './alianzas.html',
  styleUrl: './alianzas.css',
})
export class AlianzasComponent {
  constructor(
    private alianzasService: AlianzasService,
    private router: Router
  ) {}

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

    return this.alianzasService.ofertas
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
    if (familia === 'Todos') return this.alianzasService.ofertas.length;
    return this.alianzasService.ofertasDeFamilia(familia).length;
  }

  // ---------- Cifras del encabezado ----------
  readonly totalAliados = computed(() => this.alianzasService.ofertas.length);

  readonly tasaMinima = computed(() => {
    const tasas = this.alianzasService.ofertas
      .map((o) => o.tasaDesde)
      .filter((t) => t > 0);
    return tasas.length ? Math.min(...tasas) : 0;
  });

  readonly aprobacionRapida = computed(
    () =>
      this.alianzasService.ofertas.find((o) => o.aprobacion === 'Inmediata')?.aprobacion ??
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
