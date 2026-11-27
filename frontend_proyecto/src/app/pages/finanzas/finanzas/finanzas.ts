import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { FinanzasService, Movimiento, ResumenMes } from '../../../services/finanzas';
import { MetasService } from '../../../services/metas';
import { InversionesService } from '../../../services/inversiones';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { MonedaPipe } from '../../../pipes/moneda.pipe';
import { CursoBannerComponent } from '../../../shared/components/curso-banner/curso-banner';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent, NombreIcono } from '../../../shared/components/icon/icon';
import { ColumnasComponent, SerieColumnas } from '../../../shared/graficas/columnas';
import { BarraPartesComponent } from '../../../shared/graficas/barra-partes';
import { MedidorComponent } from '../../../shared/graficas/medidor';
import { GraficaLineaComponent, PuntoLinea } from '../../../shared/graficas/grafica-linea';
import { HorizonteComponent } from '../../../shared/graficas/horizonte';

/**
 * Panel de Finanzas: un RESUMEN que redirige a cada módulo real (Libro Mayor,
 * Metas, Inversiones). No administra datos propios; lee los services compartidos.
 * Orden de lectura: saldo y «¿cómo voy?» arriba, luego el flujo de 6 meses,
 * en qué se va la plata, metas, movimientos e inversiones.
 */

/** Un resultado del buscador: una sección, una meta, una inversión o un movimiento. */
interface ResultadoBusqueda {
  icono: NombreIcono;
  nombre: string;
  ruta: string;
  tipo: string;
}

type EstadoSalud = 'orden' | 'atencion' | 'riesgo';

/** Comparación de un dato del mes con el mes anterior. */
interface Comparacion {
  etiqueta: string;
  valor: number;
  /** Variación porcentual frente al mes anterior; null si no hay con qué comparar. */
  variacion: number | null;
  /** true si subir es bueno (ingresos), false si subir es malo (gastos). */
  subirEsBueno: boolean;
}

@Component({
  selector: 'app-finanzas',
  imports: [
    FinanzasMenuComponent,
    MonedaPipe,
    CursoBannerComponent,
    RouterLink,
    BandaSeccionComponent,
    IconComponent,
    ColumnasComponent,
    BarraPartesComponent,
    MedidorComponent,
    GraficaLineaComponent,
    HorizonteComponent,
  ],
  templateUrl: './finanzas.html',
  styleUrls: ['./finanzas.css'],
})
export class FinanzasComponent implements OnInit {
  private authService = inject(AuthService);
  private finanzasService = inject(FinanzasService);
  private metasService = inject(MetasService);
  private inversionesService = inject(InversionesService);

  usuario = '';

  readonly mesActual = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  ngOnInit(): void {
    this.usuario = this.authService.obtenerNombre();
  }

  /** Primer nombre, para el saludo. */
  get primerNombre(): string {
    return this.usuario.trim().split(/\s+/)[0] ?? '';
  }

  // ---------------------------------------------------------------
  // Flujo mensual
  // ---------------------------------------------------------------

  get meses(): ResumenMes[] {
    return this.finanzasService.resumenMensual(6);
  }

  get mes(): ResumenMes {
    return this.meses[this.meses.length - 1];
  }

  private get mesAnterior(): ResumenMes | undefined {
    return this.meses[this.meses.length - 2];
  }

  get disponible(): number {
    return this.mes.ingresos - this.mes.gastos;
  }

  /** Lo que queda de cada mes (ingresos menos gastos), para el horizonte de la banda. */
  get disponiblePorMes(): number[] {
    return this.meses.map((m) => m.ingresos - m.gastos);
  }

  /** Saldo acumulado mes a mes: el horizonte del fondo de la banda. */
  get saldoAcumulado(): number[] {
    let saldo = 0;
    return this.meses.map((m) => (saldo += m.ingresos - m.gastos));
  }

  get ahorroPct(): number {
    return this.mes.ingresos > 0 ? Math.round((this.disponible / this.mes.ingresos) * 100) : 0;
  }

  get etiquetasMeses(): string[] {
    return this.meses.map((m) => m.etiqueta);
  }

  get seriesFlujo(): SerieColumnas[] {
    return [
      { nombre: 'Ingresos', valores: this.meses.map((m) => m.ingresos), color: 'var(--brand-strong)' },
      { nombre: 'Gastos', valores: this.meses.map((m) => m.gastos), color: 'var(--ink)' },
    ];
  }

  get comparaciones(): Comparacion[] {
    const antes = this.mesAnterior;
    const variacion = (ahora: number, previo?: number) =>
      previo && previo > 0 ? Math.round(((ahora - previo) / previo) * 100) : null;
    return [
      { etiqueta: 'Entró', valor: this.mes.ingresos, variacion: variacion(this.mes.ingresos, antes?.ingresos), subirEsBueno: true },
      { etiqueta: 'Salió', valor: this.mes.gastos, variacion: variacion(this.mes.gastos, antes?.gastos), subirEsBueno: false },
    ];
  }

  /** Promedio de lo que queda por mes en el periodo. */
  get promedioDisponible(): number {
    const lista = this.disponiblePorMes;
    return lista.length ? Math.round(lista.reduce((s, v) => s + v, 0) / lista.length) : 0;
  }

  // ---------------------------------------------------------------
  // Salud financiera
  // ---------------------------------------------------------------

  get salud(): { estado: EstadoSalud; titulo: string; mensaje: string; icono: NombreIcono } {
    if (this.disponible < 0) {
      return { estado: 'riesgo', titulo: 'Alto riesgo', mensaje: 'Este mes gastas más de lo que entra.', icono: 'alert-triangle' };
    }
    if (this.ahorroPct < 10) {
      return { estado: 'atencion', titulo: 'Atención', mensaje: 'Te queda menos del 10 % de lo que entra.', icono: 'info' };
    }
    return { estado: 'orden', titulo: 'En orden', mensaje: `Guardas el ${this.ahorroPct} % de lo que entra.`, icono: 'check-circle' };
  }

  // ---------------------------------------------------------------
  // En qué se va la plata
  // ---------------------------------------------------------------

  get gastosDelMes() {
    return this.finanzasService.gastosPorCategoria(this.mes.clave);
  }

  /** La categoría más grande del mes, para la frase de lectura de la gráfica. */
  get mayorGasto() {
    return this.gastosDelMes[0] ?? null;
  }

  get pctMayorGasto(): number {
    const total = this.mes.gastos;
    return this.mayorGasto && total > 0 ? Math.round((this.mayorGasto.valor / total) * 100) : 0;
  }

  // ---------------------------------------------------------------
  // Metas, movimientos, inversiones
  // ---------------------------------------------------------------

  /** Las metas en curso más cercanas a cumplirse. */
  get metas() {
    return [...this.metasService.metas]
      .filter((m) => !m.cumplida)
      .sort((a, b) => b.porcentaje - a.porcentaje)
      .slice(0, 4);
  }

  get metasCumplidas(): number {
    return this.metasService.metas.filter((m) => m.cumplida).length;
  }

  get movimientos(): Movimiento[] {
    return [...this.finanzasService.movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);
  }

  iconoDe(mov: Movimiento): NombreIcono {
    return this.finanzasService.iconoPorCategoria(mov.categoria);
  }

  formatearFecha(fecha: string): string {
    const valida = new Date(`${fecha}T00:00:00`);
    if (isNaN(valida.getTime())) return fecha;
    return valida.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  }

  get totalInvertido(): number {
    return this.inversionesService.inversiones.reduce((s, i) => s + i.monto, 0);
  }

  get rendimientoTotal(): number {
    return this.inversionesService.inversiones.reduce((s, i) => s + i.rendimiento, 0);
  }

  /** Valor del portafolio en los últimos seis meses (datos de ejemplo del módulo de inversiones). */
  get crecimiento(): PuntoLinea[] {
    return this.inversionesService.historial(6);
  }

  get crecimientoPct(): number {
    const p = this.crecimiento;
    return p.length > 1 ? Math.round(((p[p.length - 1].valor - p[0].valor) / p[0].valor) * 1000) / 10 : 0;
  }

  // ---------------------------------------------------------------
  // Buscador sobre la banda
  // ---------------------------------------------------------------

  terminoBusqueda = signal('');

  private secciones: ResultadoBusqueda[] = [
    { icono: 'bar-chart', nombre: 'Finanzas', ruta: '/finanzas', tipo: 'Sección' },
    { icono: 'list', nombre: 'Libro Mayor', ruta: '/libro-mayor', tipo: 'Sección' },
    { icono: 'trending-up', nombre: 'Inversiones', ruta: '/inversiones', tipo: 'Sección' },
    { icono: 'target', nombre: 'Metas', ruta: '/metas', tipo: 'Sección' },
  ];

  get resultadosBusqueda(): ResultadoBusqueda[] {
    const termino = this.terminoBusqueda().trim().toLowerCase();
    if (!termino) return [];

    const secciones = this.secciones.filter((s) => s.nombre.toLowerCase().includes(termino));
    const metas: ResultadoBusqueda[] = this.metasService.metas
      .filter((m) => m.nombre.toLowerCase().includes(termino))
      .map((m) => ({ icono: 'target', nombre: m.nombre, ruta: '/metas', tipo: 'Meta' }));
    const inversiones: ResultadoBusqueda[] = this.inversionesService.inversiones
      .filter((i) => i.nombre.toLowerCase().includes(termino))
      .map((i) => ({ icono: 'trending-up', nombre: i.nombre, ruta: '/inversiones', tipo: 'Inversión' }));
    const movimientos: ResultadoBusqueda[] = this.movimientosQueCoinciden(termino)
      .map((m) => ({ icono: this.iconoDe(m), nombre: m.concepto, ruta: '/libro-mayor', tipo: 'Movimiento' }));

    return [...secciones, ...metas, ...inversiones, ...movimientos].slice(0, 8);
  }

  /** Conceptos únicos que coinciden (el mismo concepto se repite cada mes). */
  private movimientosQueCoinciden(termino: string): Movimiento[] {
    const vistos = new Set<string>();
    return this.finanzasService.movimientos.filter((m) => {
      const coincide = m.concepto.toLowerCase().includes(termino) || m.categoria.toLowerCase().includes(termino);
      if (!coincide || vistos.has(m.concepto)) return false;
      vistos.add(m.concepto);
      return true;
    }).slice(0, 4);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
  }

  /**
   * Curso recomendado según lo que más usa: si tiene más inversiones que
   * movimientos y metas juntos, la escuela de Inversión; si no, Finanzas Personales.
   */
  get escuelaRecomendada(): string {
    const actividadInversion = this.inversionesService.inversiones.length;
    const actividadPersonal = this.finanzasService.movimientos.length + this.metasService.metas.length;
    return actividadInversion > actividadPersonal ? 'inversion' : 'finanzas-personales';
  }
}
