import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AlianzasService, Oferta } from '../../../services/alianzas';

type Pestana = 'Características' | 'Requisitos' | 'Tarifas' | 'Preguntas';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.css',
})
export class ProductoDetalleComponent {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alianzasService = inject(AlianzasService);

  private readonly productoId = signal(
    this.ruta.snapshot.paramMap.get('productoId') ?? ''
  );

  readonly producto = computed<Oferta | undefined>(() =>
    this.alianzasService.buscarOferta(this.productoId())
  );

  readonly pestanas: Pestana[] = ['Características', 'Requisitos', 'Tarifas', 'Preguntas'];
  readonly pestanaActiva = signal<Pestana>('Características');
  readonly preguntaAbierta = signal<string | null>(null);

  seleccionarPestana(pestana: Pestana): void {
    this.pestanaActiva.set(pestana);
  }

  alternarPregunta(pregunta: string): void {
    this.preguntaAbierta.set(this.preguntaAbierta() === pregunta ? null : pregunta);
  }

  // ---------- Simulador ----------
  // Solo tiene sentido en productos con monto y plazo (créditos y compras diferidas).
  readonly simulable = computed(() => {
    const producto = this.producto();
    return !!producto && producto.montoMaximo > 0 && producto.plazoMaximo > 0;
  });

  readonly monto = signal(0);
  readonly plazoMeses = signal(24);

  constructor() {
    const producto = this.producto();
    if (producto && producto.montoMaximo > 0) {
      this.monto.set(Math.round(producto.montoMaximo * 0.25));
      this.plazoMeses.set(Math.min(24, producto.plazoMaximo));
    }
  }

  readonly plazosDisponibles = computed(() => {
    const maximo = this.producto()?.plazoMaximo ?? 0;
    return [12, 24, 36, 48, 60, 120, 240].filter((p) => p <= maximo);
  });

  readonly cuotaMensual = computed(() => {
    const producto = this.producto();
    if (!producto) return 0;

    const tasaMensual = producto.tasaDesde / 100 / 12;
    const n = this.plazoMeses();
    const capital = this.monto();

    if (n === 0) return 0;
    if (tasaMensual === 0) return Math.round(capital / n);

    return Math.round((capital * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -n)));
  });

  readonly interesesTotales = computed(
    () => this.cuotaMensual() * this.plazoMeses() - this.monto()
  );

  onMontoChange(evento: Event): void {
    this.monto.set(Number((evento.target as HTMLInputElement).value));
  }

  seleccionarPlazo(plazo: number): void {
    this.plazoMeses.set(plazo);
  }

  // ---------- Formato ----------
  formatCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  }

  formatTasa(tasa: number): string {
    return tasa === 0 ? '0%' : `${tasa.toString().replace('.', ',')}% E.A.`;
  }

  formatPlazo(meses: number): string {
    if (meses === 0) return 'Sin plazo';
    if (meses >= 12 && meses % 12 === 0) return `${meses / 12} años`;
    return `${meses} meses`;
  }

  // ---------- Navegación ----------
  solicitar(): void {
    this.router.navigate(['/alianzas/producto', this.productoId(), 'solicitud']);
  }

  volver(): void {
    this.router.navigate(['/alianzas']);
  }
}
