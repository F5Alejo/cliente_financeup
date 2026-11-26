import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AlianzasService, FichaOferta, plazosPosibles } from '../../../services/alianzas';
import { mensajeDeError } from '../../../services/api';

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

  private productoId = 0;

  // Ficha que llega del MID (GET /ofertas/:id)
  readonly producto = signal<FichaOferta | undefined>(undefined);
  readonly cargando = signal(true);
  readonly error = signal('');

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
    // Se escucha la ruta porque desde "productos parecidos" se cambia de id sin salir de la página
    this.ruta.paramMap.pipe(takeUntilDestroyed()).subscribe((parametros) => {
      this.productoId = Number(parametros.get('productoId'));
      this.cargar();
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.producto.set(undefined);
    this.pestanaActiva.set('Características');

    this.alianzasService.obtenerFicha(this.productoId).subscribe({
      next: (ficha) => {
        this.producto.set(ficha);
        // El simulador arranca en el 25% del monto máximo, sin bajar del mínimo
        if (ficha.montoMaximo > 0) {
          this.monto.set(Math.max(ficha.montoMinimo, Math.round(ficha.montoMaximo * 0.25)));
          this.plazoMeses.set(this.plazosDisponibles().find((p) => p >= 24) ?? ficha.plazoMaximo);
        }
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /** Monto mínimo del deslizador: el del producto o, si no tiene, un 5% del máximo. */
  readonly montoMinimo = computed(() => {
    const producto = this.producto();
    if (!producto) return 0;
    return producto.montoMinimo || producto.montoMaximo / 20;
  });

  readonly plazosDisponibles = computed(() => {
    const producto = this.producto();
    return producto ? plazosPosibles(producto.plazoMinimo, producto.plazoMaximo) : [];
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
    this.router.navigate(['/alianzas/producto', this.productoId, 'solicitud']);
  }

  verRelacionado(id: number): void {
    this.router.navigate(['/alianzas/producto', id]);
  }

  volver(): void {
    this.router.navigate(['/alianzas']);
  }
}
