import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import {
  AlianzasService,
  Beneficio,
  Oferta,
  Perfil,
  TipoAliado,
} from '../../../services/alianzas';

type OrdenLista = 'Recomendados' | 'Menor tasa' | 'Mayor monto' | 'Mejor calificados';

@Component({
  selector: 'app-alianzas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alianzas.html',
  styleUrl: './alianzas.css',
})
export class AlianzasComponent {
  constructor(private alianzasService: AlianzasService) {}

  // ---------- Filtros ----------
  readonly tiposAliado: TipoAliado[] = ['Bancos', 'Fintech', 'Comercio'];
  readonly beneficios: Beneficio[] = ['0% Interés', 'Cashback', 'Sin Cuota'];
  readonly perfiles: Perfil[] = ['Score Alto', 'Historial Nuevo'];
  readonly ordenes: OrdenLista[] = [
    'Recomendados',
    'Menor tasa',
    'Mayor monto',
    'Mejor calificados',
  ];

  readonly tipoAliadoSeleccionado = signal<TipoAliado | null>(null);
  readonly beneficioSeleccionado = signal<Beneficio | null>(null);
  readonly perfilSeleccionado = signal<Perfil | null>(null);
  readonly ordenSeleccionado = signal<OrdenLista>('Recomendados');
  readonly busqueda = signal('');
  readonly ofertaExpandida = signal<string | null>(null);

  seleccionarTipoAliado(tipo: TipoAliado): void {
    this.tipoAliadoSeleccionado.set(
      this.tipoAliadoSeleccionado() === tipo ? null : tipo
    );
  }

  seleccionarBeneficio(beneficio: Beneficio): void {
    this.beneficioSeleccionado.set(
      this.beneficioSeleccionado() === beneficio ? null : beneficio
    );
  }

  seleccionarPerfil(perfil: Perfil): void {
    this.perfilSeleccionado.set(this.perfilSeleccionado() === perfil ? null : perfil);
  }

  seleccionarOrden(orden: OrdenLista): void {
    this.ordenSeleccionado.set(orden);
  }

  limpiarFiltros(): void {
    this.tipoAliadoSeleccionado.set(null);
    this.beneficioSeleccionado.set(null);
    this.perfilSeleccionado.set(null);
    this.busqueda.set('');
  }

  readonly hayFiltrosActivos = computed(
    () =>
      this.tipoAliadoSeleccionado() !== null ||
      this.beneficioSeleccionado() !== null ||
      this.perfilSeleccionado() !== null ||
      this.busqueda().trim() !== ''
  );

  // ---------- Listado ----------
  readonly ofertasFiltradas = computed<Oferta[]>(() => {
    const texto = this.busqueda().toLowerCase().trim();
    const tipo = this.tipoAliadoSeleccionado();
    const beneficio = this.beneficioSeleccionado();
    const perfil = this.perfilSeleccionado();

    const filtradas = this.alianzasService.ofertas.filter((oferta) => {
      if (tipo && oferta.tipo !== tipo) return false;
      if (beneficio && oferta.beneficio !== beneficio) return false;
      if (perfil && !oferta.perfiles.includes(perfil)) return false;
      if (!texto) return true;

      return (
        oferta.aliado.toLowerCase().includes(texto) ||
        oferta.categoria.toLowerCase().includes(texto) ||
        oferta.descripcion.toLowerCase().includes(texto) ||
        oferta.etiquetas.some((etiqueta) => etiqueta.toLowerCase().includes(texto))
      );
    });

    return this.ordenar(filtradas);
  });

  private ordenar(ofertas: Oferta[]): Oferta[] {
    const copia = [...ofertas];

    switch (this.ordenSeleccionado()) {
      case 'Menor tasa':
        return copia.sort((a, b) => a.tasaDesde - b.tasaDesde);
      case 'Mayor monto':
        return copia.sort((a, b) => b.montoMaximo - a.montoMaximo);
      case 'Mejor calificados':
        return copia.sort((a, b) => b.calificacion - a.calificacion);
      default:
        return copia.sort((a, b) => b.compatibilidad - a.compatibilidad);
    }
  }

  readonly ofertasDestacadas = computed(() =>
    this.ofertasFiltradas().filter((oferta) => oferta.destacada)
  );

  // ---------- Resumen del encabezado ----------
  readonly totalAliados = computed(() => this.alianzasService.ofertas.length);

  readonly tasaMinima = computed(() => {
    const tasas = this.alianzasService.ofertas
      .map((oferta) => oferta.tasaDesde)
      .filter((tasa) => tasa > 0);
    return tasas.length ? Math.min(...tasas) : 0;
  });

  readonly usuariosTotales = computed(() =>
    this.alianzasService.ofertas.reduce((total, oferta) => total + oferta.usuarios, 0)
  );

  toggleDetalle(id: string): void {
    this.ofertaExpandida.set(this.ofertaExpandida() === id ? null : id);
  }

  // ---------- Simulador de crédito ----------
  // NOTA: tasa anual fija como placeholder de UI. Ajustar con la tasa real del backend.
  private readonly tasaAnual = 0.24;
  readonly plazosDisponibles = [12, 24, 36, 48];

  readonly monto = signal(15_000_000);
  readonly plazoMeses = signal(24);

  readonly pagoMensual = computed(() => {
    const r = this.tasaAnual / 12;
    const n = this.plazoMeses();
    const m = this.monto();
    if (r === 0) return m / n;
    const pago = (m * r) / (1 - Math.pow(1 + r, -n));
    return Math.round(pago);
  });

  readonly ahorroPotencial = computed(() => {
    // Compara el interés total pagado a 48 meses (plazo más largo) contra el plazo elegido.
    const plazoBase = 48;
    const totalActual = this.pagoMensual() * this.plazoMeses() - this.monto();
    const r = this.tasaAnual / 12;
    const pagoBase =
      r === 0 ? this.monto() / plazoBase : (this.monto() * r) / (1 - Math.pow(1 + r, -plazoBase));
    const totalBase = pagoBase * plazoBase - this.monto();
    return Math.max(0, Math.round(totalBase - totalActual));
  });

  seleccionarPlazo(plazo: number): void {
    this.plazoMeses.set(plazo);
  }

  onMontoChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.monto.set(value);
  }

  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  }

  // Abrevia montos grandes para que quepan en las tarjetas (ej: $80M).
  formatMontoCorto(valor: number): string {
    if (valor >= 1_000_000) return `$${Math.round(valor / 1_000_000)}M`;
    if (valor >= 1_000) return `$${Math.round(valor / 1_000)}K`;
    return `$${valor}`;
  }

  formatUsuarios(valor: number): string {
    return valor >= 1000 ? `${(valor / 1000).toFixed(1)}k` : `${valor}`;
  }

  formatPlazo(meses: number): string {
    if (meses === 0) return 'Sin plazo';
    if (meses >= 12 && meses % 12 === 0) return `${meses / 12} años`;
    return `${meses} meses`;
  }

  formatTasa(tasa: number): string {
    return tasa === 0 ? '0%' : `${tasa}%`;
  }
}
