import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ETIQUETA_ACCION, UsuariosService } from '../../../services/usuarios';
import { EstadoVacioComponent } from '../../../shared/components/estado-vacio/estado-vacio';
import { IconComponent } from '../../../shared/components/icon/icon';
import { KpiComponent } from '../../../shared/components/kpi/kpi';
import { PaginacionComponent } from '../../../shared/components/paginacion/paginacion';
import { AccionMenu, RowMenuComponent } from '../../../shared/components/row-menu/row-menu';
import { ActividadAdminService, EventoAdmin, IP_LOCAL, ResultadoAuditoria } from '../../../shared/services/actividad-admin';
import { ToastService } from '../../../shared/services/toast';
import { exportarCsv, exportarExcel } from '../../../shared/utils/exportar';
import { formatearFechaHora, parsearFecha } from '../../../shared/utils/fechas';
import { crearPaginador, enlazarConShell, normalizarTexto, simularCarga } from '../../../shared/utils/lista';

const CLASE_RESULTADO: Record<ResultadoAuditoria, string> = {
  Exitoso: 'badge-activo',
  Fallido: 'badge-bloqueado',
  Denegado: 'badge-pendiente',
};

@Component({
  selector: 'app-admin-auditoria',
  imports: [FormsModule, IconComponent, KpiComponent, PaginacionComponent, EstadoVacioComponent, RowMenuComponent],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css',
})
export class AdminAuditoriaComponent {
  private actividad = inject(ActividadAdminService);
  private usuariosService = inject(UsuariosService);
  private toastService = inject(ToastService);

  readonly claseResultado = CLASE_RESULTADO;
  readonly esqueletos = [1, 2, 3, 4, 5, 6];
  readonly accionesExportar: AccionMenu[] = [
    { id: 'excel', etiqueta: 'Excel (.xlsx)', icono: 'file-text' },
    { id: 'csv', etiqueta: 'CSV (.csv)', icono: 'file-text' },
  ];

  cargando = simularCarga();
  busqueda = signal('');
  filtroAdmin = signal('');
  filtroAccion = signal('');
  filtroModulo = signal('');
  fechaDesde = signal('');
  fechaHasta = signal('');

  /** Eventos del panel más las acciones sobre cuentas que registra el servicio de usuarios. */
  registros = computed<EventoAdmin[]>(() => {
    this.usuariosService.cambios();
    const deUsuarios: EventoAdmin[] = this.usuariosService.bitacora().map((r, i) => ({
      id: 100_000 + i,
      fecha: r.fecha,
      modulo: 'Usuarios',
      titulo: ETIQUETA_ACCION[r.accion],
      detalle: r.motivo,
      admin: this.nombreDe(r.admin),
      afectado: r.email,
      ip: IP_LOCAL,
      resultado: 'Exitoso',
    }));
    return [...this.actividad.eventos(), ...deUsuarios].sort((a, b) => b.fecha.localeCompare(a.fecha));
  });

  administradores = computed(() => this.unicos((r) => r.admin));
  acciones = computed(() => this.unicos((r) => r.titulo));
  modulos = computed(() => this.unicos((r) => r.modulo));

  filtrados = computed(() => {
    const texto = normalizarTexto(this.busqueda().trim());
    const admin = this.filtroAdmin();
    const accion = this.filtroAccion();
    const modulo = this.filtroModulo();
    const desde = this.fechaDesde() ? parsearFecha(this.fechaDesde()).getTime() : null;
    const hasta = this.fechaHasta() ? parsearFecha(this.fechaHasta()).getTime() + 86_399_999 : null;

    return this.registros().filter((r) => {
      const ms = new Date(r.fecha).getTime();
      if (texto && !normalizarTexto(`${r.titulo} ${r.detalle ?? ''} ${r.afectado ?? ''} ${r.admin}`).includes(texto)) return false;
      if (admin && r.admin !== admin) return false;
      if (accion && r.titulo !== accion) return false;
      if (modulo && r.modulo !== modulo) return false;
      return (desde === null || ms >= desde) && (hasta === null || ms <= hasta);
    });
  });

  exitosos = computed(() => this.registros().filter((r) => r.resultado === 'Exitoso').length);
  conProblemas = computed(() => this.registros().filter((r) => r.resultado !== 'Exitoso').length);
  hoy = computed(() => this.registros().filter((r) => new Date(r.fecha).toDateString() === new Date().toDateString()).length);

  hayFiltros = computed(
    () => !!(this.busqueda().trim() || this.filtroAdmin() || this.filtroAccion() || this.filtroModulo() || this.fechaDesde() || this.fechaHasta())
  );

  paginador = crearPaginador(() => this.filtrados().length, 10);
  filas = computed(() => this.paginador.recortar(this.filtrados()));

  constructor() {
    enlazarConShell((texto) => this.filtrar(this.busqueda, texto));
  }

  filtrar<T>(senal: { set(valor: T): void }, valor: T): void {
    senal.set(valor);
    this.paginador.reiniciar();
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroAdmin.set('');
    this.filtroAccion.set('');
    this.filtroModulo.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.paginador.reiniciar();
  }

  fechaHora(valor: string): string {
    return formatearFechaHora(valor);
  }

  exportar(formato: string): void {
    const filas = this.filtrados().map((r) => ({
      'Fecha y hora': formatearFechaHora(r.fecha),
      Administrador: r.admin,
      Acción: r.titulo,
      Detalle: r.detalle ?? '',
      Módulo: r.modulo,
      'Usuario afectado': r.afectado ?? '',
      IP: r.ip,
      Resultado: r.resultado,
    }));

    if (filas.length === 0) {
      this.toastService.info('No hay registros para exportar con los filtros actuales.');
      return;
    }

    if (formato === 'excel') {
      exportarExcel('auditoria-financeup', 'Auditoría', filas);
    } else {
      exportarCsv('auditoria-financeup', filas);
    }
    this.toastService.success(`Se exportaron ${filas.length} registros.`);
  }

  private nombreDe(email: string): string {
    const usuario = this.usuariosService.buscar(email);
    return usuario ? `${usuario.nombre} ${usuario.apellido ?? ''}`.trim() : email;
  }

  private unicos(campo: (r: EventoAdmin) => string): string[] {
    return [...new Set(this.registros().map(campo))].sort((a, b) => a.localeCompare(b, 'es'));
  }
}
