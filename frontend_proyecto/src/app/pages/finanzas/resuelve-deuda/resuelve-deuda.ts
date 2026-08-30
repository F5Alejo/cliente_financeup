import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/services/toast';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { AuthService } from '../../../services/auth';
import { ResuelveDeudaService } from '../../../services/resuelve-deuda';
import { CursoBannerComponent } from '../../../shared/components/curso-banner/curso-banner';

export interface DeudaRegistrada {
  id: number;
  entidad: string;
  saldo: number;
  tasaActual: number; // % E.A.
  cuotaActual: number;
}

/** Tasa que la plataforma ofrece al consolidar: se muestra como referencia
 *  comercial, no es una tasa comprometida hasta que el equipo de riesgo
 *  evalúe el caso real. */
const TASA_PROPUESTA_REFERENCIA = 14.9;

@Component({
  selector: 'app-resuelve-deuda',
  standalone: true,
  imports: [FinanzasMenuComponent, FormsModule, CursoBannerComponent],
  templateUrl: './resuelve-deuda.html',
  styleUrl: './resuelve-deuda.css',
})
export class ResuelveDeudaComponent implements OnInit {
  constructor(
    private toastService: ToastService,
    private authService: AuthService,
    private resuelveDeudaService: ResuelveDeudaService
  ) {}

  usuario = '';

  ngOnInit(): void {
    this.usuario = this.authService.obtenerNombre();
  }

  private siguienteId = 1;

  deudas = signal<DeudaRegistrada[]>([
    { id: this.siguienteId++, entidad: 'Banco X', saldo: 8200000, tasaActual: 28.5, cuotaActual: 620000 },
  ]);

  tasaPropuesta = TASA_PROPUESTA_REFERENCIA;

  /** ----- Formulario para agregar una deuda ----- */
  nombreEntidad = '';
  saldoDeuda: number | null = null;
  tasaDeuda: number | null = null;
  cuotaDeuda: number | null = null;

  agregarDeuda(): void {
    if (!this.nombreEntidad.trim() || !this.saldoDeuda || !this.tasaDeuda || !this.cuotaDeuda) {
      this.toastService.info('Completa entidad, saldo, tasa y cuota para agregar la deuda.');
      return;
    }
    this.deudas.update(actual => [
      ...actual,
      {
        id: this.siguienteId++,
        entidad: this.nombreEntidad.trim(),
        saldo: this.saldoDeuda!,
        tasaActual: this.tasaDeuda!,
        cuotaActual: this.cuotaDeuda!,
      },
    ]);
    this.nombreEntidad = '';
    this.saldoDeuda = null;
    this.tasaDeuda = null;
    this.cuotaDeuda = null;
    this.toastService.success('Deuda agregada al diagnóstico.');
  }

  eliminarDeuda(id: number): void {
    this.deudas.update(actual => actual.filter(d => d.id !== id));
  }

  /** ----- Totales del diagnóstico ----- */
  saldoTotal = computed(() => this.deudas().reduce((s, d) => s + d.saldo, 0));
  cuotaActualTotal = computed(() => this.deudas().reduce((s, d) => s + d.cuotaActual, 0));

  /** Cuota estimada si se consolida todo el saldo a la tasa propuesta,
   *  a un plazo de referencia de 24 meses (solo para mostrar el ahorro potencial). */
  private plazoReferenciaMeses = 24;

  cuotaEstimadaNueva = computed(() => {
    const saldo = this.saldoTotal();
    const iMensual = this.tasaPropuesta / 100 / 12;
    const n = this.plazoReferenciaMeses;
    if (saldo === 0) return 0;
    return (saldo * iMensual) / (1 - Math.pow(1 + iMensual, -n));
  });

  ahorroMensualEstimado = computed(() => this.cuotaActualTotal() - this.cuotaEstimadaNueva());

  formatearCOP(valor: number): string {
    return `$${Math.round(valor).toLocaleString('es-CO')}`;
  }

  /** Solicitud más reciente de este usuario, para mostrar su estado (Pendiente/Aprobada/Rechazada) */
  get miSolicitud() {
    const propias = this.resuelveDeudaService.solicitudes().filter((s) => s.usuario === this.usuario);
    return propias.length > 0 ? propias[propias.length - 1] : undefined;
  }

  solicitarConsolidacion(): void {
    if (this.deudas().length === 0) {
      this.toastService.info('Agrega al menos una deuda antes de solicitar la consolidación.');
      return;
    }
    if (this.miSolicitud?.estado === 'Pendiente') {
      this.toastService.info('Ya tienes una solicitud pendiente. Espera la revisión antes de enviar otra.');
      return;
    }

    this.resuelveDeudaService.crearSolicitud({
      usuario: this.usuario,
      saldoTotal: this.saldoTotal(),
      cuotaActual: this.cuotaActualTotal(),
      cuotaPropuesta: this.cuotaEstimadaNueva(),
    });
    this.toastService.success('Solicitud enviada. Nuestro equipo revisará tu caso y te contactará.');
  }
}