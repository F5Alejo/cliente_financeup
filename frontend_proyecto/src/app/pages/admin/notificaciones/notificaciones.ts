import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ETIQUETA_CATEGORIA, NotificacionAdmin, NotificacionesService } from '../../../services/notificaciones';
import { CategoriaNotificacion } from '../../../services/preferencias-admin';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio';
import { IconComponent, NombreIcono } from '../../../shared/components/icon/icon';
import { PaginacionComponent } from '../../../shared/components/paginacion/paginacion';
import { ToastService } from '../../../shared/services/toast';
import { formatearFechaHora, tiempoRelativo } from '../../../shared/utils/fechas';
import { crearPaginador, enlazarConShell, normalizarTexto, simularCarga } from '../../../shared/utils/lista';

type Pestana = 'todas' | 'sinLeer';

const ICONO_CATEGORIA: Record<CategoriaNotificacion, NombreIcono> = {
  seguridad: 'shield-check',
  usuarios: 'user-plus',
  pqr: 'life-buoy',
  alianzas: 'briefcase',
  actividad: 'activity',
};

@Component({
  selector: 'app-admin-notificaciones',
  imports: [FormsModule, IconComponent, PaginacionComponent, EstadoVacioComponent],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css',
})
export class AdminNotificacionesComponent {
  private servicio = inject(NotificacionesService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  readonly categorias = Object.entries(ETIQUETA_CATEGORIA) as [CategoriaNotificacion, string][];
  readonly etiquetaCategoria = ETIQUETA_CATEGORIA;
  readonly icono = ICONO_CATEGORIA;
  readonly esqueletos = [1, 2, 3, 4];

  cargando = simularCarga();
  pestana = signal<Pestana>('todas');
  categoria = signal<CategoriaNotificacion | ''>('');
  busqueda = signal('');

  todas = this.servicio.notificaciones;
  sinLeer = this.servicio.sinLeer;

  private base = computed(() => {
    const texto = normalizarTexto(this.busqueda().trim());
    const categoria = this.categoria();
    return this.todas().filter(
      (n) => (!categoria || n.categoria === categoria) && (!texto || normalizarTexto(`${n.titulo} ${n.detalle}`).includes(texto))
    );
  });

  conteoTodas = computed(() => this.base().length);
  conteoSinLeer = computed(() => this.base().filter((n) => !n.leida).length);
  filtradas = computed(() => (this.pestana() === 'sinLeer' ? this.base().filter((n) => !n.leida) : this.base()));

  paginador = crearPaginador(() => this.filtradas().length, 10);
  visibles = computed(() => this.paginador.recortar(this.filtradas()));

  constructor() {
    enlazarConShell((texto) => this.filtrar(this.busqueda, texto));
  }

  filtrar<T>(senal: { set(valor: T): void }, valor: T): void {
    senal.set(valor);
    this.paginador.reiniciar();
  }

  relativo(fecha: string): string {
    return tiempoRelativo(fecha);
  }

  completa(fecha: string): string {
    return formatearFechaHora(fecha);
  }

  marcarLeida(notificacion: NotificacionAdmin): void {
    this.servicio.marcarLeida(notificacion.id);
  }

  marcarTodas(): void {
    if (this.sinLeer() === 0) {
      this.toastService.info('No tienes notificaciones sin leer.');
      return;
    }
    this.servicio.marcarTodasLeidas();
    this.toastService.success('Todas las notificaciones quedaron como leídas.');
  }

  abrir(notificacion: NotificacionAdmin): void {
    this.servicio.marcarLeida(notificacion.id);
    this.router.navigateByUrl(notificacion.ruta);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.categoria.set('');
    this.pestana.set('todas');
    this.paginador.reiniciar();
  }
}
