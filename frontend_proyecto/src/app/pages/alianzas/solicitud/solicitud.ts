import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlianzasService, Oferta, Solicitud } from '../../../services/alianzas';
import { AuthService } from '../../../services/auth';
import { ToastService } from '../../../shared/services/toast';

@Component({
  selector: 'app-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitud.html',
  styleUrl: './solicitud.css',
})
export class SolicitudComponent {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alianzasService = inject(AlianzasService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  private readonly productoId = signal(
    this.ruta.snapshot.paramMap.get('productoId') ?? ''
  );

  readonly producto = computed<Oferta | undefined>(() =>
    this.alianzasService.buscarOferta(this.productoId())
  );

  readonly pasos = ['Tus datos', 'Condiciones', 'Confirmación'];
  readonly paso = signal(0);
  readonly enviando = signal(false);
  readonly radicado = signal<Solicitud | null>(null);

  // Modelo del formulario
  nombre = '';
  documento = '';
  correo = '';
  celular = '';
  monto = 0;
  plazoMeses = 24;
  ingresos = 0;
  aceptaTerminos = false;

  readonly errores = signal<Record<string, string>>({});

  constructor() {
    const usuario = this.authService.obtenerUsuario();
    if (usuario) {
      this.nombre = usuario.nombre;
      this.correo = usuario.email;
    }

    const producto = this.producto();
    if (producto && producto.montoMaximo > 0) {
      this.monto = Math.round(producto.montoMaximo * 0.25);
      this.plazoMeses = Math.min(24, producto.plazoMaximo);
    }
  }

  readonly pideMonto = computed(() => (this.producto()?.montoMaximo ?? 0) > 0);

  readonly plazosDisponibles = computed(() => {
    const maximo = this.producto()?.plazoMaximo ?? 0;
    return [12, 24, 36, 48, 60, 120, 240].filter((p) => p <= maximo);
  });

  readonly cuotaEstimada = computed(() => {
    const producto = this.producto();
    if (!producto || !this.pideMonto()) return 0;

    const tasa = producto.tasaDesde / 100 / 12;
    if (this.plazoMeses === 0) return 0;
    if (tasa === 0) return Math.round(this.monto / this.plazoMeses);

    return Math.round((this.monto * tasa) / (1 - Math.pow(1 + tasa, -this.plazoMeses)));
  });

  /** Peso de la cuota sobre el ingreso declarado: el dato que define la aprobación. */
  readonly cargaIngreso = computed(() => {
    if (!this.ingresos || !this.cuotaEstimada()) return 0;
    return Math.round((this.cuotaEstimada() / this.ingresos) * 100);
  });

  // ---------- Validación ----------

  private validarPasoActual(): boolean {
    const errores: Record<string, string> = {};

    if (this.paso() === 0) {
      if (this.nombre.trim().length < 5) {
        errores['nombre'] = 'Escribe tu nombre completo como aparece en la cédula.';
      }
      if (!/^\d{6,12}$/.test(this.documento.trim())) {
        errores['documento'] = 'El documento va sin puntos, entre 6 y 12 dígitos.';
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(this.correo.trim())) {
        errores['correo'] = 'Revisa el correo, ahí te enviamos la respuesta.';
      }
      if (!/^\d{10}$/.test(this.celular.trim())) {
        errores['celular'] = 'El celular son 10 dígitos, sin indicativo.';
      }
    }

    if (this.paso() === 1) {
      if (this.ingresos <= 0) {
        errores['ingresos'] = 'Necesitamos tu ingreso mensual para estudiar la solicitud.';
      }
      if (this.pideMonto() && this.monto <= 0) {
        errores['monto'] = 'Indica cuánto necesitas.';
      }
    }

    if (this.paso() === 2 && !this.aceptaTerminos) {
      errores['terminos'] = 'Debes autorizar la consulta en centrales de riesgo.';
    }

    this.errores.set(errores);
    return Object.keys(errores).length === 0;
  }

  error(campo: string): string | undefined {
    return this.errores()[campo];
  }

  // ---------- Navegación del formulario ----------

  siguiente(): void {
    if (!this.validarPasoActual()) return;

    if (this.paso() < 2) {
      this.paso.update((p) => p + 1);
      return;
    }

    this.enviar();
  }

  atras(): void {
    this.errores.set({});
    if (this.paso() === 0) {
      this.router.navigate(['/alianzas/producto', this.productoId()]);
      return;
    }
    this.paso.update((p) => p - 1);
  }

  private enviar(): void {
    const producto = this.producto();
    if (!producto) return;

    this.enviando.set(true);

    // Simula el tiempo de radicación contra el aliado.
    setTimeout(() => {
      const solicitud = this.alianzasService.radicarSolicitud({
        productoId: producto.id,
        producto: producto.categoria,
        aliado: producto.aliado,
        monto: this.pideMonto() ? this.monto : 0,
        plazoMeses: this.pideMonto() ? this.plazoMeses : 0,
        nombre: this.nombre.trim(),
        documento: this.documento.trim(),
        correo: this.correo.trim(),
        celular: this.celular.trim(),
        ingresos: this.ingresos,
      });

      this.enviando.set(false);
      this.radicado.set(solicitud);
      this.toastService.success(`Solicitud radicada con el número ${solicitud.radicado}.`);
    }, 900);
  }

  seleccionarPlazo(plazo: number): void {
    this.plazoMeses = plazo;
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

  // ---------- Salidas ----------

  volverAlProducto(): void {
    this.router.navigate(['/alianzas/producto', this.productoId()]);
  }

  volverAAlianzas(): void {
    this.router.navigate(['/alianzas']);
  }
}
