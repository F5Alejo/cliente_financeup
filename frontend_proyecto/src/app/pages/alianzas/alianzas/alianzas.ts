import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { AlianzasService } from '../../../services/alianzas';

type TipoAliado = 'Bancos' | 'Fintech' | 'Comercio';
type Beneficio = '0% Interés' | 'Cashback' | 'Sin Cuota';
type Perfil = 'Score Alto' | 'Historial Nuevo';

@Component({
  selector: 'app-alianzas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alianzas.html',
  styleUrl: './alianzas.css',
})
export class AlianzasComponent {
  constructor(private alianzasService: AlianzasService) {}

  get ofertas() {
    return this.alianzasService.ofertas;
  }

  // ---------- Filtros ----------
  readonly tiposAliado: TipoAliado[] = ['Bancos', 'Fintech', 'Comercio'];
  readonly beneficios: Beneficio[] = ['0% Interés', 'Cashback', 'Sin Cuota'];
  readonly perfiles: Perfil[] = ['Score Alto', 'Historial Nuevo'];

  readonly tipoAliadoSeleccionado = signal<TipoAliado>('Bancos');
  readonly beneficioSeleccionado = signal<Beneficio | null>(null);
  readonly perfilSeleccionado = signal<Perfil | null>(null);
  readonly busqueda = signal('');

  seleccionarTipoAliado(tipo: TipoAliado): void {
    this.tipoAliadoSeleccionado.set(tipo);
  }

  seleccionarBeneficio(beneficio: Beneficio): void {
    this.beneficioSeleccionado.set(
      this.beneficioSeleccionado() === beneficio ? null : beneficio
    );
  }

  seleccionarPerfil(perfil: Perfil): void {
    this.perfilSeleccionado.set(this.perfilSeleccionado() === perfil ? null : perfil);
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
}
