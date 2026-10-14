import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AlianzasService } from '../../../services/alianzas';
import { EducacionService } from '../../../services/educacion';
import { PqrService } from '../../../services/pqr';
import { AccionBitacora, UsuariosService } from '../../../services/usuarios';
import { IconComponent, NombreIcono } from '../../../shared/components/icon/icon';
import { KpiComponent, TendenciaKpi } from '../../../shared/components/kpi/kpi';
import { ActividadAdminService, ModuloAdmin } from '../../../shared/services/actividad-admin';
import { AdminBusquedaService } from '../../../shared/services/admin-busqueda';
import { diasDesde, formatearFechaHora, parsearFecha, tiempoRelativo } from '../../../shared/utils/fechas';
import { simularCarga } from '../../../shared/utils/lista';

type Tono = 'primary' | 'warning' | 'danger' | 'neutral';

interface EventoLinea {
  ms: number;
  fecha: string;
  titulo: string;
  detalle: string;
  icono: NombreIcono;
  tono: Tono;
}

interface Alerta {
  titulo: string;
  detalle: string;
  ruta: string;
  nivel: 'warning' | 'info';
}

const BITACORA: Record<AccionBitacora, { titulo: string; icono: NombreIcono; tono: Tono }> = {
  creacion: { titulo: 'Usuario creado', icono: 'user-plus', tono: 'primary' },
  edicion: { titulo: 'Datos de usuario actualizados', icono: 'pencil', tono: 'neutral' },
  'cambio-rol': { titulo: 'Cambio de permisos', icono: 'shield-check', tono: 'warning' },
  bloqueo: { titulo: 'Usuario bloqueado', icono: 'ban', tono: 'danger' },
  desbloqueo: { titulo: 'Usuario desbloqueado', icono: 'unlock', tono: 'primary' },
  restablecimiento: { titulo: 'Restablecimiento de contraseña', icono: 'key', tono: 'neutral' },
  eliminacion: { titulo: 'Usuario eliminado', icono: 'trash', tono: 'danger' },
};

const ICONO_MODULO: Record<ModuloAdmin, NombreIcono> = {
  Usuarios: 'users',
  Finanzas: 'wallet',
  Inversiones: 'trending-up',
  Metas: 'target',
  Educación: 'graduation-cap',
  Alianzas: 'briefcase',
  PQR: 'life-buoy',
  Roles: 'shield-check',
  Reportes: 'bar-chart',
  Seguridad: 'lock',
  Configuración: 'settings',
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Convierte fechas como "12 ago 2025" (formato de las PQR) en milisegundos; null si no se reconoce. */
function fechaTextoAMs(texto: string): number | null {
  const partes = /^(\d{1,2}) (\w{3}) (\d{4})$/.exec(texto.trim());
  const mes = partes ? MESES.indexOf(partes[2].toLowerCase()) : -1;
  return partes && mes >= 0 ? new Date(Number(partes[3]), mes, Number(partes[1])).getTime() : null;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, IconComponent, KpiComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class AdminDashboardComponent {
  private usuariosService = inject(UsuariosService);
  private pqrService = inject(PqrService);
  private alianzasService = inject(AlianzasService);
  private educacionService = inject(EducacionService);
  private actividadAdmin = inject(ActividadAdminService);
  private shell = inject(AdminBusquedaService);
  private router = inject(Router);

  readonly esqueletos = [1, 2, 3, 4, 5];
  cargando = simularCarga();

  private usuarios = computed(() => {
    this.usuariosService.cambios();
    return this.usuariosService.listar();
  });

  totalUsuarios = computed(() => this.usuarios().length);
  activos = computed(() => this.usuarios().filter((u) => u.estado === 'activo').length);
  bloqueados = computed(() => this.usuarios().filter((u) => u.estado === 'bloqueado').length);
  pendientes = computed(() => this.usuarios().filter((u) => u.estado === 'pendiente').length);
  suspendidos = computed(() => this.usuarios().filter((u) => u.estado === 'suspendido').length);
  porcentajeActivos = computed(() => (this.totalUsuarios() ? Math.round((this.activos() / this.totalUsuarios()) * 100) : 0));

  tendenciaRegistros = computed<TendenciaKpi>(() => {
    const dias = (u: { fechaRegistro?: string }) => (u.fechaRegistro ? diasDesde(u.fechaRegistro) : Infinity);
    const actuales = this.usuarios().filter((u) => dias(u) <= 30).length;
    const previos = this.usuarios().filter((u) => dias(u) > 30 && dias(u) <= 60).length;
    const diferencia = actuales - previos;
    return {
      texto: `${diferencia > 0 ? '+' : ''}${diferencia} vs. 30 días previos`,
      direccion: diferencia > 0 ? 'sube' : diferencia < 0 ? 'baja' : 'igual',
    };
  });

  pqrPendientes = this.pqrService.pqrs.filter((p) => p.estado === 'Radicado' || p.estado === 'En revisión');
  pqrAlta = this.pqrPendientes.filter((p) => p.prioridad === 'Alta').length;
  alianzasActivas = this.alianzasService.ofertas.length;
  solicitudesEnEstudio = this.alianzasService.solicitudes.filter((s) => s.estado === 'En estudio').length;
  cursosPublicados = this.educacionService.todosLosCursos().length;
  escuelas = this.educacionService.escuelas.length;

  eventos = computed<EventoLinea[]>(() => {
    const lista: EventoLinea[] = [];
    const agregar = (fecha: string, ms: number, titulo: string, detalle: string, icono: NombreIcono, tono: Tono) =>
      lista.push({ ms, fecha, titulo, detalle, icono, tono });

    for (const u of this.usuarios()) {
      if (u.fechaRegistro) {
        agregar(u.fechaRegistro, parsearFecha(u.fechaRegistro).getTime(), 'Usuario registrado', `${u.nombre} ${u.apellido ?? ''}`.trim() + ` · ${u.email}`, 'user-plus', 'primary');
      }
    }
    this.usuariosService.cambios();
    for (const r of this.usuariosService.bitacora()) {
      const info = BITACORA[r.accion];
      agregar(r.fecha, parsearFecha(r.fecha).getTime(), info.titulo, `${r.email} · ${r.motivo}`, info.icono, info.tono);
    }
    for (const p of this.pqrService.pqrs) {
      const ms = fechaTextoAMs(p.fechaCreacion);
      if (ms !== null) agregar(new Date(ms).toISOString(), ms, 'PQR recibido', `${p.titulo} · N.º ${p.numero}`, 'life-buoy', 'warning');
    }
    for (const e of this.actividadAdmin.eventos()) {
      agregar(e.fecha, parsearFecha(e.fecha).getTime(), e.titulo, e.detalle ?? e.modulo, ICONO_MODULO[e.modulo], 'primary');
    }
    return lista.sort((a, b) => b.ms - a.ms).slice(0, 8);
  });

  alertas = computed<Alerta[]>(() => {
    const lista: Alerta[] = [];
    const plural = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

    if (this.pqrPendientes.length) {
      lista.push({
        titulo: `${plural(this.pqrPendientes.length, 'PQR pendiente', 'PQR pendientes')} de respuesta`,
        detalle: this.pqrAlta ? `${this.pqrAlta} con prioridad alta.` : 'Ninguna con prioridad alta.',
        ruta: '/admin/pqr',
        nivel: 'warning',
      });
    }
    if (this.solicitudesEnEstudio) {
      lista.push({
        titulo: `${plural(this.solicitudesEnEstudio, 'solicitud de alianza', 'solicitudes de alianza')} en estudio`,
        detalle: 'Esperan una decisión del equipo.',
        ruta: '/admin/alianzas',
        nivel: 'warning',
      });
    }
    if (this.pendientes()) {
      lista.push({
        titulo: `${plural(this.pendientes(), 'cuenta pendiente', 'cuentas pendientes')} de activación`,
        detalle: 'Usuarios que aún no confirman su registro.',
        ruta: '/admin/usuarios',
        nivel: 'warning',
      });
    }
    if (this.bloqueados()) {
      lista.push({
        titulo: plural(this.bloqueados(), 'cuenta bloqueada', 'cuentas bloqueadas'),
        detalle: 'Revisa si alguna debe reactivarse.',
        ruta: '/admin/usuarios',
        nivel: 'info',
      });
    }
    if (this.suspendidos()) {
      lista.push({
        titulo: plural(this.suspendidos(), 'cuenta suspendida', 'cuentas suspendidas'),
        detalle: 'Suspensiones temporales vigentes.',
        ruta: '/admin/usuarios',
        nivel: 'info',
      });
    }
    return lista;
  });

  relativo(fecha: string): string {
    return tiempoRelativo(fecha);
  }

  completa(fecha: string): string {
    return formatearFechaHora(fecha);
  }

  crear(ruta: string): void {
    this.shell.accion.set('nuevo');
    this.router.navigateByUrl(ruta);
  }
}
