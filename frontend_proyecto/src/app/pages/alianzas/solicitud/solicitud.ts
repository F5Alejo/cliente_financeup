import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlianzasService, FichaOferta, plazosPosibles } from '../../../services/alianzas';
import { mensajeDeError } from '../../../services/api';
import { AuthService } from '../../../services/auth';
import { ToastService } from '../../../shared/services/toast';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';

/** Lo que se muestra en el acuse cuando el MID radica la solicitud. */
interface Acuse {
  radicado: string;
  producto: string;
  aliado: string;
  monto: number;
  plazoMeses: number;
  cuotaEstimada: number;
  asesor: string;
  fecha: string;
  estado: string;
  correo: string;
}

@Component({
  selector: 'app-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BandaSeccionComponent, IconComponent],
  templateUrl: './solicitud.html',
  styleUrl: './solicitud.css',
})
export class SolicitudComponent {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alianzasService = inject(AlianzasService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  private readonly productoId = Number(this.ruta.snapshot.paramMap.get('productoId'));

  // Ficha del producto que llega del MID (GET /ofertas/:id)
  readonly producto = signal<FichaOferta | undefined>(undefined);
  readonly cargando = signal(true);

  readonly pasos = ['Tus datos', 'Condiciones', 'Confirmación'];
  readonly paso = signal(0);
  readonly enviando = signal(false);
  readonly radicado = signal<Acuse | null>(null);

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

    this.alianzasService.obtenerFicha(this.productoId).subscribe({
      next: (ficha) => {
        this.producto.set(ficha);
        // Se arranca en el 25% del monto máximo, sin bajar del mínimo del producto
        if (ficha.montoMaximo > 0) {
          this.monto = Math.max(ficha.montoMinimo, Math.round(ficha.montoMaximo * 0.25));
          this.plazoMeses = this.plazosDisponibles().find((p) => p >= 24) ?? ficha.plazoMaximo;
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  readonly pideMonto = computed(() => (this.producto()?.montoMaximo ?? 0) > 0);

  readonly montoMinimo = computed(() => {
    const producto = this.producto();
    if (!producto) return 0;
    return producto.montoMinimo || producto.montoMaximo / 20;
  });

  readonly plazosDisponibles = computed(() => {
    const producto = this.producto();
    return producto ? plazosPosibles(producto.plazoMinimo, producto.plazoMaximo) : [];
  });

  // monto, plazo e ingresos son campos del formulario (no signals), por eso estos dos son métodos
  cuotaEstimada(): number {
    const producto = this.producto();
    if (!producto || !this.pideMonto() || this.plazoMeses === 0) return 0;

    const tasa = producto.tasaDesde / 100 / 12;
    if (tasa === 0) return Math.round(this.monto / this.plazoMeses);

    return Math.round((this.monto * tasa) / (1 - Math.pow(1 + tasa, -this.plazoMeses)));
  }

  /** Peso de la cuota sobre el ingreso declarado: el dato que define la aprobación. */
  cargaIngreso(): number {
    if (!this.ingresos || !this.cuotaEstimada()) return 0;
    return Math.round((this.cuotaEstimada() / this.ingresos) * 100);
  }

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
      if (this.pideMonto() && (this.monto < this.montoMinimo() || this.monto > (this.producto()?.montoMaximo ?? 0))) {
        errores['monto'] = `El monto va entre ${this.formatCOP(this.montoMinimo())} y ${this.formatCOP(this.producto()?.montoMaximo ?? 0)}.`;
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
      this.router.navigate(['/alianzas/producto', this.productoId]);
      return;
    }
    this.paso.update((p) => p - 1);
  }

  private enviar(): void {
    const producto = this.producto();
    if (!producto) return;

    this.enviando.set(true);
    this.alianzasService
      .radicarSolicitud({
        idProducto: producto.id,
        monto: this.pideMonto() ? this.monto : 0,
        plazoMeses: this.pideMonto() ? this.plazoMeses : 0,
        nombre: this.nombre.trim(),
        documento: this.documento.trim(),
        correo: this.correo.trim(),
        celular: this.celular.trim(),
        ingresos: this.ingresos,
        aceptaTerminos: this.aceptaTerminos,
      })
      .subscribe({
        next: (respuesta) => {
          this.enviando.set(false);
          this.radicado.set({
            ...respuesta,
            aliado: producto.aliado,
            correo: this.correo.trim(),
            fecha: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
          });
          this.toastService.success(`Solicitud radicada con el número ${respuesta.radicado}.`);
        },
        error: (error) => {
          // El MID explica qué falló (monto fuera de rango, datos incompletos...)
          this.enviando.set(false);
          this.toastService.error(mensajeDeError(error));
        },
      });
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
    this.router.navigate(['/alianzas/producto', this.productoId]);
  }

  volverAAlianzas(): void {
    this.router.navigate(['/alianzas']);
  }
}
