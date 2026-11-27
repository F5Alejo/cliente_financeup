import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EstadoPqr, Pqr, PqrService } from '../../../services/pqr';
import { ToastService } from '../../../shared/services/toast';
import { AuthService } from '../../../services/auth';

type FiltroEstado = 'Todas' | EstadoPqr;

const RUTA_LOGIN = '/login';

import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';
import { MedidorComponent } from '../../../shared/graficas/medidor';
import { BarraPartesComponent, Parte } from '../../../shared/graficas/barra-partes';
@Component({
  selector: 'app-pqr',
  imports: [CommonModule, FormsModule, BandaSeccionComponent, IconComponent, MedidorComponent, BarraPartesComponent],
  templateUrl: './pqr.html',
  styleUrl: './pqr.css',
})
export class PqrComponent {
  private pqrService = inject(PqrService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // =========================
  // TEXTOS DEL COMPONENTE
  // =========================

  tituloPagina = 'Mis PQR';
  subtituloPagina = 'Consulta el estado de tus peticiones, quejas y reclamos en un solo lugar.';
  placeholderBuscador = 'Buscar por título, radicado o categoría';
  botonVerMas = 'Ver detalle';
  tituloCrearNuevo = 'Crear nueva PQR';
  textoCrearNuevo = 'Radica una petición, queja, reclamo o sugerencia y haz seguimiento a su avance.';
  botonCrearNuevo = 'Radicar PQR';
  mensajeSinSesion = 'Inicia sesión para consultar el estado de tus PQR.';

  // =========================
  // DATOS (vienen del MID)
  // =========================

  readonly estaAutenticado = this.authService.estaAutenticado();
  readonly pqrs = this.pqrService.misPqr;
  readonly cargando = this.pqrService.cargando;
  readonly error = this.pqrService.error;

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.pqrService.cargarMisPqr();
  }

  // =========================
  // BUSCADOR Y FILTROS
  // =========================

  readonly busqueda = signal('');
  readonly filtroEstado = signal<FiltroEstado>('Todas');
  readonly estados: FiltroEstado[] = ['Todas', 'Abierta', 'En revisión', 'Resuelta', 'Cerrada', 'Rechazada'];

  readonly filtradas = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    const estado = this.filtroEstado();

    return this.pqrs().filter((pqr) => {
      if (estado !== 'Todas' && pqr.estado !== estado) return false;
      if (!texto) return true;
      return `${pqr.titulo} ${pqr.radicado} ${pqr.categoria}`.toLowerCase().includes(texto);
    });
  });

  // =========================
  // RESUMEN
  // =========================

  readonly totalPqrs = computed(() => this.pqrs().length);
  readonly enCurso = computed(() => this.pqrs().filter((p) => p.estado === 'Abierta' || p.estado === 'En revisión').length);
  readonly resueltas = computed(() => this.pqrs().filter((p) => p.estado === 'Resuelta' || p.estado === 'Cerrada').length);

  // Clase CSS del distintivo según el estado del caso.
  /** Casos por estado, para la barra segmentada (solo estados con casos). */
  readonly porEstado = computed<Parte[]>(() =>
    this.estados
      .filter((e) => e !== 'Todas')
      .map((e) => ({ etiqueta: e, valor: this.pqrs().filter((p) => p.estado === e).length }))
      .filter((p) => p.valor > 0)
  );

  readonly pctResueltas = computed(() =>
    this.totalPqrs() ? Math.round((this.resueltas() / this.totalPqrs()) * 100) : 0
  );

  claseEstado(estado: EstadoPqr): string {
    if (estado === 'Resuelta' || estado === 'Cerrada') return 'is-resuelto';
    if (estado === 'Rechazada') return 'is-rechazado';
    return 'is-revision';
  }

  clasePrioridad(prioridad: string): string {
    if (prioridad === 'Alta') return 'is-alta';
    if (prioridad === 'Baja') return 'is-baja';
    return 'is-media';
  }

  // =========================
  // ACCIONES
  // =========================

  verPqr(pqr: Pqr): void {
    this.router.navigate(['/ver-pqr', pqr.radicado]);
  }

  crearNuevaPqr(): void {
    if (!this.estaAutenticado) {
      this.toastService.info('Inicia sesión para radicar una nueva PQR.');
      this.router.navigate([RUTA_LOGIN]);
      return;
    }
    this.router.navigate(['/nuevo-pqr']);
  }
}
