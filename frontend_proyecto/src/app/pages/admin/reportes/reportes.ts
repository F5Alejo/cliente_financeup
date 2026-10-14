import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlianzasService } from '../../../services/alianzas';
import { EducacionService } from '../../../services/educacion';
import { FinanzasService } from '../../../services/finanzas';
import { PqrService } from '../../../services/pqr';
import { ETIQUETA_ACCION, ETIQUETA_ESTADO, ETIQUETA_ROL, UsuariosService } from '../../../services/usuarios';
import { DistribucionComponent } from '../../../shared/components/distribucion/distribucion';
import { DatoGrafico, GraficoBarrasComponent } from '../../../shared/components/grafico-barras/grafico-barras';
import { IconComponent, NombreIcono } from '../../../shared/components/icon/icon';
import { KpiComponent, TendenciaKpi } from '../../../shared/components/kpi/kpi';
import { ActividadAdminService } from '../../../shared/services/actividad-admin';
import { ToastService } from '../../../shared/services/toast';
import { exportarExcel, FilaExportable } from '../../../shared/utils/exportar';
import { formatearFechaHora, parsearFecha } from '../../../shared/utils/fechas';
import { simularCarga } from '../../../shared/utils/lista';

type Tema = 'usuarios' | 'pqr' | 'cursos' | 'alianzas' | 'finanzas' | 'actividad';
type Formato = 'numero' | 'moneda';

interface KpiReporte {
  etiqueta: string;
  valor: string;
  icono: NombreIcono;
  pie: string;
  tono?: '' | 'neutral' | 'warning';
  tendencia?: TendenciaKpi;
}

interface SeccionReporte {
  titulo: string;
  descripcion: string;
  tipo: 'barras' | 'distribucion';
  datos: DatoGrafico[];
  formato: Formato;
  columna: string;
  escala?: 'total' | 'maximo';
  porcentaje?: boolean;
  tonos?: ('' | 'gray' | 'warning' | 'danger')[];
}

interface Reporte {
  kpis: KpiReporte[];
  secciones: SeccionReporte[];
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const FORMATO_COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const formatoNumero = (n: number) => n.toLocaleString('es-CO');
const formatoMoneda = (n: number) => FORMATO_COP.format(n);
const formatoMonedaCompacto = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M` : n >= 1000 ? `$${Math.round(n / 1000)} mil` : `$${n}`;

/** Ventana de meses terminando en el mes actual: [{ clave: 'aaaa-m', etiqueta }] */
function ventanaMeses(cantidad: number): { anio: number; mes: number; etiqueta: string }[] {
  const hoy = new Date();
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (cantidad - 1 - i), 1);
    const sufijo = cantidad > 6 ? ` ${String(fecha.getFullYear()).slice(2)}` : '';
    return { anio: fecha.getFullYear(), mes: fecha.getMonth(), etiqueta: MESES[fecha.getMonth()] + sufijo };
  });
}

function contarPorMes(fechas: string[], ventana: { anio: number; mes: number; etiqueta: string }[]): DatoGrafico[] {
  return ventana.map((m) => ({
    etiqueta: m.etiqueta,
    valor: fechas.filter((f) => {
      const d = parsearFecha(f);
      return d.getFullYear() === m.anio && d.getMonth() === m.mes;
    }).length,
  }));
}

function agrupar<T>(lista: T[], clave: (item: T) => string): DatoGrafico[] {
  const mapa = new Map<string, number>();
  for (const item of lista) mapa.set(clave(item), (mapa.get(clave(item)) ?? 0) + 1);
  return [...mapa].map(([etiqueta, valor]) => ({ etiqueta, valor })).sort((a, b) => b.valor - a.valor);
}

@Component({
  selector: 'app-admin-reportes',
  imports: [FormsModule, IconComponent, KpiComponent, GraficoBarrasComponent, DistribucionComponent],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class AdminReportesComponent {
  private usuariosService = inject(UsuariosService);
  private pqrService = inject(PqrService);
  private educacionService = inject(EducacionService);
  private alianzasService = inject(AlianzasService);
  private finanzasService = inject(FinanzasService);
  private actividadService = inject(ActividadAdminService);
  private toastService = inject(ToastService);

  readonly temas: { valor: Tema; etiqueta: string; icono: NombreIcono }[] = [
    { valor: 'usuarios', etiqueta: 'Usuarios', icono: 'users' },
    { valor: 'pqr', etiqueta: 'PQR', icono: 'life-buoy' },
    { valor: 'cursos', etiqueta: 'Cursos', icono: 'graduation-cap' },
    { valor: 'alianzas', etiqueta: 'Alianzas', icono: 'briefcase' },
    { valor: 'finanzas', etiqueta: 'Finanzas', icono: 'wallet' },
    { valor: 'actividad', etiqueta: 'Actividad del sistema', icono: 'activity' },
  ];
  readonly periodos = [
    { valor: 3, etiqueta: 'Últimos 3 meses' },
    { valor: 6, etiqueta: 'Últimos 6 meses' },
    { valor: 12, etiqueta: 'Últimos 12 meses' },
  ];
  readonly formatos: Record<Formato, (n: number) => string> = { numero: formatoNumero, moneda: formatoMoneda };
  readonly formatosEje: Record<Formato, (n: number) => string> = { numero: formatoNumero, moneda: formatoMonedaCompacto };

  tema = signal<Tema>('usuarios');
  periodo = signal(6);
  generado = signal(new Date());
  version = signal(0);
  cargando = simularCarga();
  actualizando = signal(false);

  temaActual = computed(() => this.temas.find((t) => t.valor === this.tema()) ?? this.temas[0]);
  generadoTexto = computed(() => formatearFechaHora(this.generado().toISOString()));

  reporte = computed<Reporte>(() => {
    this.version();
    this.usuariosService.cambios();
    switch (this.tema()) {
      case 'usuarios': return this.reporteUsuarios();
      case 'pqr': return this.reportePqr();
      case 'cursos': return this.reporteCursos();
      case 'alianzas': return this.reporteAlianzas();
      case 'finanzas': return this.reporteFinanzas();
      default: return this.reporteActividad();
    }
  });

  usaPeriodo = computed(() => this.tema() === 'usuarios' || this.tema() === 'actividad');

  items(seccion: SeccionReporte) {
    return seccion.datos.map((d, i) => ({ ...d, tono: seccion.tonos?.[i] ?? ('' as const) }));
  }

  generar(): void {
    this.actualizando.set(true);
    setTimeout(() => {
      this.version.update((v) => v + 1);
      this.generado.set(new Date());
      this.actualizando.set(false);
      this.actividadService.registrar('Reportes', 'Generó un reporte', this.temaActual().etiqueta);
      this.toastService.success('Reporte generado con los datos más recientes.');
    }, 500);
  }

  exportarExcel(): void {
    const reporte = this.reporte();
    const filas: FilaExportable[] = [
      ...reporte.kpis.map((k) => ({ Sección: 'Indicadores', Concepto: k.etiqueta, Valor: k.valor })),
      ...reporte.secciones.flatMap((s) =>
        s.datos.map((d) => ({ Sección: s.titulo, Concepto: d.etiqueta, Valor: this.formatos[s.formato](d.valor) }))
      ),
    ];
    exportarExcel(`reporte-${this.tema()}-financeup`, this.temaActual().etiqueta.slice(0, 30), filas);
    this.actividadService.registrar('Reportes', 'Exportó un reporte', `${this.temaActual().etiqueta} (Excel).`);
    this.toastService.success('Reporte exportado a Excel.');
  }

  exportarPdf(): void {
    this.actividadService.registrar('Reportes', 'Exportó un reporte', `${this.temaActual().etiqueta} (PDF).`);
    this.toastService.info('En la ventana de impresión elige «Guardar como PDF».');
    setTimeout(() => window.print(), 300);
  }

  private reporteUsuarios(): Reporte {
    const usuarios = this.usuariosService.listar();
    const meses = this.periodo();
    const ventana = ventanaMeses(meses);
    const registros = usuarios.map((u) => u.fechaRegistro).filter((f): f is string => !!f);
    const crecimiento = contarPorMes(registros, ventana);
    const nuevos = crecimiento.reduce((s, d) => s + d.valor, 0);

    const anteriores = contarPorMes(registros, ventanaMesesAnterior(meses)).reduce((s, d) => s + d.valor, 0);
    const diferencia = nuevos - anteriores;
    const activos = usuarios.filter((u) => u.estado === 'activo').length;

    return {
      kpis: [
        { etiqueta: 'Usuarios registrados', valor: formatoNumero(usuarios.length), icono: 'users', pie: 'en total' },
        { etiqueta: 'Usuarios activos', valor: formatoNumero(activos), icono: 'check-circle', pie: `${usuarios.length ? Math.round((activos / usuarios.length) * 100) : 0}% del total` },
        {
          etiqueta: 'Nuevos en el periodo',
          valor: formatoNumero(nuevos),
          icono: 'user-plus',
          pie: `en ${meses} meses`,
          tendencia: {
            texto: `${diferencia > 0 ? '+' : ''}${diferencia} vs. periodo anterior`,
            direccion: diferencia > 0 ? 'sube' : diferencia < 0 ? 'baja' : 'igual',
          },
        },
        { etiqueta: 'Sin acceso', valor: formatoNumero(usuarios.length - activos), icono: 'ban', pie: 'bloqueados, suspendidos o pendientes', tono: 'neutral' },
      ],
      secciones: [
        { titulo: 'Crecimiento de usuarios', descripcion: 'Usuarios nuevos por mes.', tipo: 'barras', datos: crecimiento, formato: 'numero', columna: 'Nuevos usuarios' },
        {
          titulo: 'Usuarios por estado',
          descripcion: 'Participación de cada estado de cuenta.',
          tipo: 'distribucion',
          datos: (['activo', 'pendiente', 'suspendido', 'bloqueado'] as const).map((e) => ({
            etiqueta: ETIQUETA_ESTADO[e],
            valor: usuarios.filter((u) => u.estado === e).length,
          })),
          formato: 'numero',
          columna: 'Usuarios',
          tonos: ['', 'warning', 'gray', 'danger'],
        },
        {
          titulo: 'Usuarios por rol',
          descripcion: 'Cuentas según su rol.',
          tipo: 'distribucion',
          datos: (['user', 'admin'] as const).map((r) => ({ etiqueta: ETIQUETA_ROL[r], valor: usuarios.filter((u) => u.rol === r).length })),
          formato: 'numero',
          columna: 'Usuarios',
        },
      ],
    };
  }

  private reportePqr(): Reporte {
    const pqrs = this.pqrService.pqrs;
    const pendientes = pqrs.filter((p) => p.estado === 'Radicado' || p.estado === 'En revisión').length;
    return {
      kpis: [
        { etiqueta: 'PQR recibidas', valor: formatoNumero(pqrs.length), icono: 'life-buoy', pie: 'en total', tono: 'neutral' },
        { etiqueta: 'Pendientes', valor: formatoNumero(pendientes), icono: 'clock', pie: 'sin resolver', tono: 'warning' },
        { etiqueta: 'Resueltas', valor: formatoNumero(pqrs.filter((p) => p.estado === 'Resuelto').length), icono: 'check-circle', pie: 'cerradas con respuesta' },
        { etiqueta: 'Prioridad alta', valor: formatoNumero(pqrs.filter((p) => p.prioridad === 'Alta').length), icono: 'alert-triangle', pie: 'del total', tono: 'neutral' },
      ],
      secciones: [
        { titulo: 'PQR por estado', descripcion: 'Situación actual de las solicitudes.', tipo: 'distribucion', datos: agrupar(pqrs, (p) => p.estado), formato: 'numero', columna: 'PQR' },
        { titulo: 'PQR por prioridad', descripcion: 'Urgencia asignada a cada solicitud.', tipo: 'distribucion', datos: agrupar(pqrs, (p) => p.prioridad), formato: 'numero', columna: 'PQR' },
        { titulo: 'PQR por tipo', descripcion: 'Petición, queja o reclamo.', tipo: 'distribucion', datos: agrupar(pqrs, (p) => p.tipo), formato: 'numero', columna: 'PQR' },
      ],
    };
  }

  private reporteCursos(): Reporte {
    const escuelas = this.educacionService.escuelas;
    const cursos = this.educacionService.todosLosCursos();
    const estudiantes = cursos.reduce((s, c) => s + c.estudiantes, 0);
    const conNota = cursos.filter((c) => c.calificacion > 0);
    return {
      kpis: [
        { etiqueta: 'Cursos publicados', valor: formatoNumero(cursos.length), icono: 'graduation-cap', pie: `en ${escuelas.length} escuelas` },
        { etiqueta: 'Estudiantes', valor: formatoNumero(estudiantes), icono: 'users', pie: 'inscritos en total', tono: 'neutral' },
        { etiqueta: 'Calificación promedio', valor: conNota.length ? (conNota.reduce((s, c) => s + c.calificacion, 0) / conNota.length).toFixed(1) : '—', icono: 'activity', pie: 'sobre 5', tono: 'neutral' },
        { etiqueta: 'Con certificado', valor: formatoNumero(cursos.filter((c) => c.certificado).length), icono: 'shield-check', pie: 'cursos que certifican' },
      ],
      secciones: [
        { titulo: 'Estudiantes por escuela', descripcion: 'Inscritos en cada escuela.', tipo: 'distribucion', datos: escuelas.map((e) => ({ etiqueta: e.nombre, valor: e.cursos.reduce((s, c) => s + c.estudiantes, 0) })), formato: 'numero', columna: 'Estudiantes' },
        { titulo: 'Cursos por nivel', descripcion: 'Distribución de la oferta.', tipo: 'distribucion', datos: agrupar(cursos, (c) => c.nivel), formato: 'numero', columna: 'Cursos' },
        { titulo: 'Cursos por formato', descripcion: 'Video, artículo o quiz.', tipo: 'distribucion', datos: agrupar(cursos, (c) => c.formato), formato: 'numero', columna: 'Cursos' },
      ],
    };
  }

  private reporteAlianzas(): Reporte {
    const ofertas = this.alianzasService.ofertas;
    const solicitudes = this.alianzasService.solicitudes;
    return {
      kpis: [
        { etiqueta: 'Alianzas activas', valor: formatoNumero(ofertas.length), icono: 'briefcase', pie: 'ofertas publicadas' },
        { etiqueta: 'Destacadas', valor: formatoNumero(ofertas.filter((o) => o.destacada).length), icono: 'shield-check', pie: 'visibles en primer lugar', tono: 'neutral' },
        { etiqueta: 'Solicitudes', valor: formatoNumero(solicitudes.length), icono: 'file-text', pie: 'recibidas en esta sesión', tono: 'neutral' },
        { etiqueta: 'Usuarios vinculados', valor: formatoNumero(ofertas.reduce((s, o) => s + o.usuarios, 0)), icono: 'users', pie: 'entre todas las ofertas', tono: 'neutral' },
      ],
      secciones: [
        { titulo: 'Ofertas por familia', descripcion: 'Créditos, tarjetas, ahorro y comercios.', tipo: 'distribucion', datos: agrupar(ofertas, (o) => o.familia), formato: 'numero', columna: 'Ofertas' },
        {
          titulo: 'Usuarios por aliado',
          descripcion: 'Los aliados con más usuarios vinculados.',
          tipo: 'distribucion',
          datos: [...ofertas].sort((a, b) => b.usuarios - a.usuarios).slice(0, 6).map((o) => ({ etiqueta: o.aliado, valor: o.usuarios })),
          formato: 'numero',
          columna: 'Usuarios',
          escala: 'maximo',
          porcentaje: false,
        },
      ],
    };
  }

  private reporteFinanzas(): Reporte {
    const movimientos = this.finanzasService.movimientos;
    const ingresos = movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.valor, 0);
    const gastos = movimientos.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + m.valor, 0);
    const porCategoria = new Map<string, number>();
    for (const m of movimientos.filter((mov) => mov.tipo === 'gasto')) {
      porCategoria.set(m.categoria, (porCategoria.get(m.categoria) ?? 0) + m.valor);
    }
    return {
      kpis: [
        { etiqueta: 'Total ingresos', valor: formatoMoneda(ingresos), icono: 'arrow-up-right', pie: `${movimientos.filter((m) => m.tipo === 'ingreso').length} movimientos` },
        { etiqueta: 'Total gastos', valor: formatoMoneda(gastos), icono: 'arrow-down-right', pie: `${movimientos.filter((m) => m.tipo === 'gasto').length} movimientos`, tono: 'neutral' },
        { etiqueta: 'Balance neto', valor: formatoMoneda(ingresos - gastos), icono: 'wallet', pie: ingresos >= gastos ? 'ingresos superan a gastos' : 'gastos superan a ingresos', tono: ingresos >= gastos ? '' : 'warning' },
        { etiqueta: 'Movimientos', valor: formatoNumero(movimientos.length), icono: 'list', pie: 'registrados', tono: 'neutral' },
      ],
      secciones: [
        {
          titulo: 'Ingresos frente a gastos',
          descripcion: 'Comparación sobre todos los movimientos.',
          tipo: 'distribucion',
          datos: [{ etiqueta: 'Ingresos', valor: ingresos }, { etiqueta: 'Gastos', valor: gastos }],
          formato: 'moneda',
          columna: 'Valor',
          escala: 'maximo',
          porcentaje: false,
          tonos: ['', 'gray'],
        },
        {
          titulo: 'Gastos por categoría',
          descripcion: 'Participación de cada categoría en los gastos.',
          tipo: 'distribucion',
          datos: [...porCategoria].sort((a, b) => b[1] - a[1]).map(([etiqueta, valor]) => ({ etiqueta, valor })),
          formato: 'moneda',
          columna: 'Gasto',
        },
      ],
    };
  }

  private reporteActividad(): Reporte {
    const meses = this.periodo();
    const ventana = ventanaMeses(meses);
    const deUsuarios = this.usuariosService.bitacora().map((r) => ({ fecha: r.fecha, modulo: 'Usuarios', resultado: 'Exitoso', titulo: ETIQUETA_ACCION[r.accion] }));
    const eventos = [...this.actividadService.eventos().map((e) => ({ fecha: e.fecha, modulo: e.modulo as string, resultado: e.resultado as string, titulo: e.titulo })), ...deUsuarios];
    const desde = new Date(ventana[0].anio, ventana[0].mes, 1).getTime();
    const enPeriodo = eventos.filter((e) => new Date(e.fecha).getTime() >= desde);
    const exitosos = enPeriodo.filter((e) => e.resultado === 'Exitoso').length;

    return {
      kpis: [
        { etiqueta: 'Acciones registradas', valor: formatoNumero(enPeriodo.length), icono: 'activity', pie: `en ${meses} meses` },
        { etiqueta: 'Exitosas', valor: formatoNumero(exitosos), icono: 'check-circle', pie: 'sin errores' },
        { etiqueta: 'Con incidencias', valor: formatoNumero(enPeriodo.length - exitosos), icono: 'alert-triangle', pie: 'fallidas o denegadas', tono: 'warning' },
        { etiqueta: 'Módulos activos', valor: formatoNumero(new Set(enPeriodo.map((e) => e.modulo)).size), icono: 'dashboard', pie: 'con actividad', tono: 'neutral' },
      ],
      secciones: [
        { titulo: 'Acciones por mes', descripcion: 'Actividad administrativa registrada.', tipo: 'barras', datos: contarPorMes(enPeriodo.map((e) => e.fecha), ventana), formato: 'numero', columna: 'Acciones' },
        { titulo: 'Acciones por módulo', descripcion: 'Dónde se concentra la actividad.', tipo: 'distribucion', datos: agrupar(enPeriodo, (e) => e.modulo), formato: 'numero', columna: 'Acciones' },
      ],
    };
  }
}

function ventanaMesesAnterior(cantidad: number): { anio: number; mes: number; etiqueta: string }[] {
  const hoy = new Date();
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - cantidad - (cantidad - 1 - i), 1);
    return { anio: fecha.getFullYear(), mes: fecha.getMonth(), etiqueta: '' };
  });
}
