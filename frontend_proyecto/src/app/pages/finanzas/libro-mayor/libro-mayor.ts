import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx'; // Librería para leer/escribir archivos Excel (.xlsx) en el navegador
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { CursoBannerComponent } from '../../../shared/components/curso-banner/curso-banner';
import { FinanzasService, Movimiento } from '../../../services/finanzas';
import { DatosMovimiento, FormularioMovimientoComponent } from './formulario-movimiento/formulario-movimiento';
import { ToastService } from '../../../shared/services/toast';
import { MonedaPipe } from '../../../pipes/moneda.pipe';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent, NombreIcono } from '../../../shared/components/icon/icon';
import { BotonComponent } from '../../../shared/components/ui/boton/boton';
import { GraficaLineaComponent, PuntoLinea } from '../../../shared/graficas/grafica-linea';
import { BarraPartesComponent, Parte } from '../../../shared/graficas/barra-partes';
import { MedidorComponent } from '../../../shared/graficas/medidor';

/**
 * COMPONENTE: Libro Mayor
 * ------------------------------------------------------------------
 * Le permite al usuario llevar el control de sus movimientos de dinero
 * (ingresos y gastos): agregarlos a mano, editarlos, borrarlos, filtrarlos,
 * exportarlos a Excel, o importarlos masivamente desde un archivo Excel.
 *
 * Los movimientos viven en `FinanzasService` (no aquí adentro), porque el
 * dashboard de Finanzas también los necesita para sus tarjetas y su tabla
 * de "Movimientos recientes" — al compartir el mismo service, agregar,
 * editar o borrar un movimiento en cualquiera de las dos pantallas se ve
 * reflejado en la otra.
 *
 * Angular usa "signals" (la función `signal(...)`) para guardar valores que
 * cambian con el tiempo. Un signal se LEE llamándolo como función (`algo()`)
 * y se ACTUALIZA con `.set(valor)` o `.update(fn)`. Cuando un signal cambia,
 * Angular vuelve a dibujar automáticamente la parte del HTML que lo usa.
 * ------------------------------------------------------------------
 */

/** Describe por qué una fila del Excel importado NO se pudo usar. */
interface ErrorImportacion {
  fila: number;
  motivo: string;
}

/** Columnas por las que se puede ordenar la tabla. */
type ColumnaOrden = 'fecha' | 'concepto' | 'categoria' | 'tipo' | 'valor';

@Component({
  selector: 'app-libro-mayor',
  imports: [
    FinanzasMenuComponent,
    FormsModule,
    CursoBannerComponent,
    FormularioMovimientoComponent,
    MonedaPipe,
    BandaSeccionComponent,
    IconComponent,
    BotonComponent,
    GraficaLineaComponent,
    BarraPartesComponent,
    MedidorComponent,
  ],
  templateUrl: './libro-mayor.html',
  styleUrls: ['../finanzas-pagina.css', './libro-mayor.css'],
})
export class LibroMayorComponent {
  private finanzasService = inject(FinanzasService);
  private toastService = inject(ToastService);

  /** Categorías que el usuario puede elegir tanto en el formulario como en los filtros. */
  categoriasDisponibles: string[] = [
    'Vivienda', 'Alimentación', 'Transporte', 'Salud', 'Entretenimiento',
    'Servicios', 'Educación', 'Gastos hormiga', 'Salario', 'Otros ingresos',
    'Ahorro', 'Otros',
  ];

  /** Los movimientos reales viven en el service compartido con Finanzas;
   *  este getter es solo una "ventana" de lectura hacia ellos. */
  get movimientos(): Movimiento[] {
    return this.finanzasService.movimientos;
  }

  /** ----- Filtros y búsqueda -----
   *  Cada filtro es un signal independiente; el getter `movimientosFiltrados`
   *  de abajo los combina todos para decidir qué filas mostrar. */
  textoBusqueda = signal('');
  categoriaFiltro = signal('Todas');
  tipoFiltro = signal<'todos' | 'ingreso' | 'gasto'>('todos');
  fechaDesde = signal('');
  fechaHasta = signal('');

  /** ----- Orden de la tabla ----- */
  columnaOrden = signal<ColumnaOrden>('fecha');
  direccionOrden = signal<'asc' | 'desc'>('desc');

  /** Se llama al hacer clic en el encabezado de una columna.
   *  Si ya se estaba ordenando por esa columna, invierte la dirección;
   *  si es una columna distinta, empieza a ordenar por ella en modo ascendente. */
  ordenarPor(columna: ColumnaOrden): void {
    if (this.columnaOrden() === columna) {
      this.direccionOrden.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.columnaOrden.set(columna);
      this.direccionOrden.set('asc');
    }
  }

  /** Devuelve la lista de movimientos ya filtrada y ordenada.
   *  Al ser un "getter", se vuelve a calcular automáticamente cada vez
   *  que Angular revisa la pantalla (por ejemplo, al cambiar un filtro). */
  get movimientosFiltrados(): Movimiento[] {
    const texto = this.textoBusqueda().toLowerCase().trim();
    const categoria = this.categoriaFiltro();
    const tipo = this.tipoFiltro();
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();

    // 1) Filtrar: se queda solo con los movimientos que cumplen TODAS las condiciones activas.
    let resultado = this.movimientos.filter(m => {
      const coincideTexto = texto === '' || m.concepto.toLowerCase().includes(texto);
      const coincideCategoria = categoria === 'Todas' || m.categoria === categoria;
      const coincideTipo = tipo === 'todos' || m.tipo === tipo;
      const coincideDesde = !desde || m.fecha >= desde; // comparar fechas como texto funciona porque el formato es YYYY-MM-DD
      const coincideHasta = !hasta || m.fecha <= hasta;
      return coincideTexto && coincideCategoria && coincideTipo && coincideDesde && coincideHasta;
    });

    // 2) Ordenar: según la columna y dirección elegidas.
    const columna = this.columnaOrden();
    const direccion = this.direccionOrden();
    resultado = [...resultado].sort((a, b) => {
      const comparacion = columna === 'valor'
        ? a.valor - b.valor
        : String(a[columna]).localeCompare(String(b[columna]));
      return direccion === 'asc' ? comparacion : -comparacion;
    });

    return resultado;
  }

  /** Vuelve a dejar todos los filtros en su valor por defecto. */
  limpiarFiltros(): void {
    this.textoBusqueda.set('');
    this.categoriaFiltro.set('Todas');
    this.tipoFiltro.set('todos');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
  }

  /** ----- Totales (calculados sobre lo que está filtrado, no sobre todo) ----- */
  get totalIngresos(): number {
    return this.movimientosFiltrados.reduce((suma, m) => (m.tipo === 'ingreso' ? suma + m.valor : suma), 0);
  }

  get totalGastos(): number {
    return this.movimientosFiltrados.reduce((suma, m) => (m.tipo === 'gasto' ? suma + m.valor : suma), 0);
  }

  get ahorro(): number {
    return this.totalIngresos - this.totalGastos;
  }

  get porcentajeAhorro(): number {
    return this.totalIngresos > 0 ? Math.round((this.ahorro / this.totalIngresos) * 100) : 0;
  }

  /** ----- Indicadores nuevos del módulo (todos reutilizan los totales de arriba) ----- */

  /** Cuánto se ha ido en la categoría "Gastos hormiga". */
  get gastosHormiga(): number {
    return this.movimientosFiltrados.reduce((s, m) => (m.categoria === 'Gastos hormiga' ? s + m.valor : s), 0);
  }

  /** Cuánto se ha guardado en la categoría "Ahorro". */
  get totalAhorros(): number {
    return this.movimientosFiltrados.reduce((s, m) => (m.categoria === 'Ahorro' ? s + m.valor : s), 0);
  }

  /** El "otro lado" del % de ahorro: qué porcentaje de lo que entró ya se gastó. */
  get porcentajeGastado(): number {
    return 100 - this.porcentajeAhorro;
  }

  /** Lo que queda de los ingresos después de los gastos fijos (sin contar
   *  gastos hormiga) — es decir, cuánto se podría ahorrar si se controlan
   *  los gastos hormiga. */
  get capacidadAhorro(): number {
    return this.totalIngresos - (this.totalGastos - this.gastosHormiga);
  }

  /** Si el ahorro de este periodo se repitiera 12 veces, cuánto sería en un año. */
  get proyeccionAhorroAnual(): number {
    return this.ahorro * 12;
  }

  /** ----- Gráficas (también sobre lo filtrado) ----- */

  /** Saldo acumulado al cierre de cada mes que tiene movimientos, del más antiguo al más reciente. */
  get saldoMensual(): PuntoLinea[] {
    const porMes = new Map<string, number>();
    for (const m of this.movimientosFiltrados) {
      const clave = m.fecha.slice(0, 7);
      porMes.set(clave, (porMes.get(clave) ?? 0) + (m.tipo === 'ingreso' ? m.valor : -m.valor));
    }
    let saldo = 0;
    return [...porMes.keys()].sort().map((clave) => {
      saldo += porMes.get(clave)!;
      const [anio, mes] = clave.split('-').map(Number);
      const etiqueta = new Date(anio, mes - 1, 1).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
      return { etiqueta, valor: saldo };
    });
  }

  /** El horizonte del fondo de la banda: el mismo saldo, siempre de todo el historial. */
  get horizonteBanda(): number[] {
    let saldo = 0;
    return this.finanzasService.resumenMensual(12).map((m) => (saldo += m.ingresos - m.gastos));
  }

  /** Gasto por categoría de lo filtrado, de mayor a menor. */
  get gastosPorCategoria(): Parte[] {
    const mapa = new Map<string, number>();
    for (const m of this.movimientosFiltrados) {
      if (m.tipo === 'gasto') mapa.set(m.categoria, (mapa.get(m.categoria) ?? 0) + m.valor);
    }
    return [...mapa.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor })).sort((a, b) => b.valor - a.valor);
  }

  get pctMayorGasto(): number {
    const mayor = this.gastosPorCategoria[0];
    return mayor && this.totalGastos > 0 ? Math.round((mayor.valor / this.totalGastos) * 100) : 0;
  }

  /** Qué parte de los gastos se fue en gastos hormiga. */
  get pctHormiga(): number {
    return this.totalGastos > 0 ? Math.round((this.gastosHormiga / this.totalGastos) * 100) : 0;
  }

  /** Opciones del control segmentado de tipo. */
  readonly tipos: { id: 'todos' | 'ingreso' | 'gasto'; etiqueta: string }[] = [
    { id: 'todos', etiqueta: 'Todo' },
    { id: 'ingreso', etiqueta: 'Ingresos' },
    { id: 'gasto', etiqueta: 'Gastos' },
  ];

  get hayFiltros(): boolean {
    return !!(this.textoBusqueda() || this.categoriaFiltro() !== 'Todas' || this.tipoFiltro() !== 'todos' || this.fechaDesde() || this.fechaHasta());
  }

  /** Solo se muestra la columna Método si algún movimiento la tiene. */
  get hayMetodos(): boolean {
    return this.movimientos.some((m) => !!m.metodoPago);
  }

  /** ----- Paginación simple: 20 filas y "Ver más" ----- */
  limite = signal(20);

  get movimientosVisibles(): Movimiento[] {
    return this.movimientosFiltrados.slice(0, this.limite());
  }

  get restantes(): number {
    return this.movimientosFiltrados.length - this.limite();
  }

  verMas(): void {
    this.limite.update((n) => n + 20);
  }

  iconoDe(categoria: string): NombreIcono {
    return this.finanzasService.iconoPorCategoria(categoria);
  }

  /** '2026-11-12' → '12 nov' (y el año si no es el actual). */
  fechaCorta(iso: string): string {
    const [anio, mes, dia] = iso.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    if (anio !== new Date().getFullYear()) opciones.year = 'numeric';
    return fecha.toLocaleDateString('es-CO', opciones).replace('.', '');
  }

  /** Valor de aria-sort del encabezado de una columna. */
  ordenAria(columna: ColumnaOrden): 'ascending' | 'descending' | 'none' {
    if (this.columnaOrden() !== columna) return 'none';
    return this.direccionOrden() === 'asc' ? 'ascending' : 'descending';
  }

  abs(n: number): number {
    return Math.abs(n);
  }

  /** Da formato de pesos colombianos a un número, ej: 1200000 -> "$1.200.000". */
  formatearCOP(valor: number): string {
    return `$${Math.abs(valor).toLocaleString('es-CO')}`;
  }

  /** ----- Formulario de agregar / editar -----
   *  El formulario vive en `FormularioMovimientoComponent` (Signal Forms).
   *  Aquí solo se decide si está abierto y con qué movimiento. */
  mostrarFormulario = signal(false);
  movimientoEnEdicion = signal<Movimiento | undefined>(undefined);

  /** Abre el formulario limpio, listo para crear un movimiento nuevo. */
  abrirFormularioNuevo(): void {
    this.movimientoEnEdicion.set(undefined);
    this.mostrarFormulario.set(true);
  }

  /** Abre el formulario con los datos del movimiento ya cargados, para editarlo. */
  abrirFormularioEditar(movimiento: Movimiento): void {
    this.movimientoEnEdicion.set(movimiento);
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
  }

  /** Recibe los datos ya validados y los guarda en el service compartido. */
  guardarMovimiento(datos: DatosMovimiento): void {
    const enEdicion = this.movimientoEnEdicion();
    if (enEdicion) {
      this.finanzasService.editarMovimiento(enEdicion.id, datos);
      this.emitirMensaje('exito', 'Movimiento actualizado.');
    } else {
      this.finanzasService.agregarMovimiento(datos);
      this.emitirMensaje('exito', datos.tipo === 'gasto' ? 'Gasto registrado.' : 'Ingreso registrado.');
    }
    this.mostrarFormulario.set(false);
  }

  /** ----- Eliminar con confirmación -----
   *  En vez de borrar apenas se hace clic, guardamos el id en `idAEliminar`
   *  y mostramos un aviso; solo se borra de verdad si el usuario confirma. */
  idAEliminar = signal<number | null>(null);

  pedirConfirmacionEliminar(id: number): void {
    this.idAEliminar.set(id);
  }

  cancelarEliminar(): void {
    this.idAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const id = this.idAEliminar();
    if (id === null) return;
    this.finanzasService.eliminarMovimiento(id);
    this.idAEliminar.set(null);
    this.emitirMensaje('exito', 'Movimiento eliminado.');
  }

  /** ----- Mensajes de éxito / error (toast) -----
   *  Usan el aviso flotante compartido de la app (ToastService). */
  private emitirMensaje(tipo: 'exito' | 'error', texto: string): void {
    if (tipo === 'exito') this.toastService.success(texto);
    else this.toastService.error(texto);
  }

  /** ============================================================
   *  EXPORTAR EN FORMATO "CONTROL DE TUS FINANZAS"
   *  ------------------------------------------------------------
   *  En vez de una tabla plana, generamos un Excel con el mismo diseño
   *  del formato de presupuesto personal que usa el usuario: 3 columnas
   *  de detalle (Ingresos / Gastos fijos / Gastos hormiga) + un resumen
   *  con fórmulas, para que pueda abrirlo y ajustar sus cuentas a mano.
   * ============================================================ */
  exportar(): void {
    const libro = XLSX.utils.book_new();
    const hoja: XLSX.WorkSheet = {};

    // Pequeños ayudantes para no repetir "{ t: 's', v: ... }" en cada celda.
    const texto = (celda: string, valor: string) => { hoja[celda] = { t: 's', v: valor }; };
    const numero = (celda: string, valor: number) => { hoja[celda] = { t: 'n', v: valor }; };
    const formula = (celda: string, expresion: string) => { hoja[celda] = { t: 'n', f: expresion }; };

    // Título de cada una de las 3 columnas de detalle, más el resumen.
    texto('D5', 'INGRESOS');
    texto('H5', 'GASTOS MENSUALES - FIJOS');
    texto('L5', 'GASTOS DIARIOS - HORMIGA');
    texto('P5', 'RESUMEN');

    texto('D7', 'CONCEPTO');
    texto('E7', 'VALOR');
    texto('H7', 'CONCEPTO');
    texto('I7', 'VALOR');
    texto('L7', 'CONCEPTO');
    texto('M7', 'VALOR');

    // Repartimos los movimientos (ya filtrados) en las 3 categorías del formato.
    // "Gastos hormiga" usa esa categoría tal cual; el resto de los gastos se
    // consideran "fijos"; todo lo que sea tipo "ingreso" va en Ingresos.
    const ingresos = this.movimientosFiltrados.filter(m => m.tipo === 'ingreso');
    const gastosHormiga = this.movimientosFiltrados.filter(m => m.tipo === 'gasto' && m.categoria === 'Gastos hormiga');
    const gastosFijos = this.movimientosFiltrados.filter(m => m.tipo === 'gasto' && m.categoria !== 'Gastos hormiga');

    /** Escribe una lista de movimientos desde la fila 8 hacia abajo, en las
     *  columnas indicadas, y debajo agrega la fila "TOTAL" con una fórmula
     *  SUMA. Devuelve en qué fila quedó ese TOTAL (las 3 listas pueden tener
     *  largos distintos, así que cada una termina en una fila diferente). */
    const escribirLista = (items: Movimiento[], colConcepto: string, colValor: string): number => {
      items.forEach((m, indice) => {
        const fila = 8 + indice;
        texto(`${colConcepto}${fila}`, m.concepto);
        numero(`${colValor}${fila}`, m.valor);
      });

      const filaTotal = 8 + items.length;
      texto(`${colConcepto}${filaTotal}`, 'TOTAL');
      if (items.length > 0) {
        formula(`${colValor}${filaTotal}`, `SUM(${colValor}8:${colValor}${filaTotal - 1})`);
      } else {
        numero(`${colValor}${filaTotal}`, 0); // sin movimientos en esta categoría: total en 0
      }
      return filaTotal;
    };

    const filaTotalIngresos = escribirLista(ingresos, 'D', 'E');
    const filaTotalFijos = escribirLista(gastosFijos, 'H', 'I');
    const filaTotalHormiga = escribirLista(gastosHormiga, 'L', 'M');

    // Resumen: fórmulas que apuntan a los 3 totales de arriba, igual que en
    // la plantilla de referencia (10% de ahorro sugerido, gasto total,
    // balance del mes y lo que sobra después de apartar el ahorro).
    texto('P7', 'PROYECCIÓN DE AHORRO (10%)');
    formula('S7', `E${filaTotalIngresos}*0.1`);

    texto('P8', 'TOTAL DE GASTOS');
    formula('S8', `I${filaTotalFijos}+M${filaTotalHormiga}`);

    texto('P9', 'BALANCE DEL MES');
    formula('S9', `E${filaTotalIngresos}-S8`);

    texto('P10', '(-) AHORRO MENSUAL');
    formula('S10', 'S9-S7');

    // Combina las celdas de los títulos, igual que en la plantilla original.
    hoja['!merges'] = [
      XLSX.utils.decode_range('D5:E6'),
      XLSX.utils.decode_range('H5:I6'),
      XLSX.utils.decode_range('L5:M6'),
      XLSX.utils.decode_range('P5:S6'),
      XLSX.utils.decode_range('P7:R7'),
      XLSX.utils.decode_range('P8:R8'),
      XLSX.utils.decode_range('P9:R9'),
      XLSX.utils.decode_range('P10:R10'),
    ];

    // Ancho de columnas para que el texto no se vea cortado.
    const anchos: XLSX.ColInfo[] = [];
    anchos[3] = { wch: 26 };  // D: concepto ingresos
    anchos[4] = { wch: 12 };  // E: valor ingresos
    anchos[7] = { wch: 28 };  // H: concepto gastos fijos
    anchos[8] = { wch: 12 };  // I: valor gastos fijos
    anchos[11] = { wch: 26 }; // L: concepto gastos hormiga
    anchos[12] = { wch: 12 }; // M: valor gastos hormiga
    anchos[15] = { wch: 26 }; // P: etiquetas del resumen
    anchos[18] = { wch: 14 }; // S: valores del resumen
    hoja['!cols'] = anchos;

    // Le decimos a Excel hasta dónde llega la hoja con datos.
    const ultimaFila = Math.max(filaTotalIngresos, filaTotalFijos, filaTotalHormiga, 10);
    hoja['!ref'] = `A1:S${ultimaFila}`;

    XLSX.utils.book_append_sheet(libro, hoja, 'Control de finanzas');
    XLSX.writeFile(libro, 'control-de-tus-finanzas.xlsx');
  }

  /** ============================================================
   *  IMPORTAR EXCEL (flujo de 3 pasos: leer instrucciones, descargar
   *  la plantilla, y subir + validar el archivo antes de confirmarlo)
   * ============================================================ */
  mostrarImportador = signal(false);
  mostrarCamposOpcionales = signal(false);
  archivoSeleccionado = signal<File | null>(null);
  resultadoImportacion = signal<{ validos: Omit<Movimiento, 'id'>[]; errores: ErrorImportacion[] } | null>(null);

  abrirImportador(): void {
    this.mostrarImportador.set(true);
    this.archivoSeleccionado.set(null);
    this.resultadoImportacion.set(null);
  }

  cerrarImportador(): void {
    this.mostrarImportador.set(false);
  }

  alternarCamposOpcionales(): void {
    this.mostrarCamposOpcionales.update(v => !v);
  }

  // archivo fijo guardado en la carpeta "public/" del proyecto
  // (public/plantilla-control-finanzas.xlsx).

  /** Se llama cuando el usuario elige un archivo en el <input type="file">. */
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado.set(input.files?.[0] ?? null);
    this.resultadoImportacion.set(null); // si ya había un resultado previo, se descarta
  }

  /** ------------------------------------------------------------
   *  Lee UNA de las 3 columnas del Excel (Concepto/Valor), fila por fila,
   *  empezando en la fila 8 (que es donde arranca la plantilla).
   *
   *  Se detiene apenas encuentra una celda de "Concepto" vacía, o que diga
   *  "TOTAL" — esa es la señal de que ya no hay más datos en esa columna.
   *
   *  Los movimientos encontrados NO se guardan todavía en el service (por
   *  eso no traen `id` aquí): eso solo pasa cuando el usuario confirma la
   *  importación, en `confirmarImportacion()`.
   *
   *  Parámetros:
   *    hoja               -> la hoja de Excel ya leída (objeto de SheetJS)
   *    colConcepto         -> letra de la columna de texto, ej: 'D', 'H', 'L'
   *    colValor             -> letra de la columna de números, ej: 'E', 'I', 'M'
   *    tipo                -> si esta columna es de 'ingreso' o de 'gasto'
   *    categoriaPorDefecto -> qué categoría se le asigna a cada fila leída
   *    errores              -> lista compartida donde se anota si una fila
   *                            tiene concepto pero le falta un valor válido
   * ------------------------------------------------------------ */
  private leerColumna(
    hoja: XLSX.WorkSheet,
    colConcepto: string,
    colValor: string,
    tipo: 'ingreso' | 'gasto',
    categoriaPorDefecto: string,
    errores: ErrorImportacion[]
  ): Omit<Movimiento, 'id'>[] {
    const encontrados: Omit<Movimiento, 'id'>[] = [];
    let fila = 8; // la plantilla siempre empieza los datos en la fila 8

    while (true) {
      const celdaConcepto = hoja[`${colConcepto}${fila}`];

      // Celda vacía o "TOTAL": aquí se acaban los datos de esta columna.
      if (!celdaConcepto || !celdaConcepto.v || celdaConcepto.v === 'TOTAL') {
        break;
      }

      const celdaValor = hoja[`${colValor}${fila}`];
      const valor = celdaValor ? Number(celdaValor.v) : NaN;

      if (!valor || valor <= 0) {
        // Hay un concepto escrito, pero el valor no es un número válido.
        errores.push({
          fila,
          motivo: `"${celdaConcepto.v}" (celda ${colValor}${fila}) no tiene un valor numérico válido.`,
        });
      } else {
        encontrados.push({
          // La plantilla no tiene columna de fecha, así que se usa la fecha de hoy.
          // toISOString ("2026-08-30T19:42:10.123Z)
          // z horario utc
          // t separador
          // slice AAAA-MM-DD
          fecha: new Date().toISOString().slice(0, 10),
          concepto: String(celdaConcepto.v),
          categoria: categoriaPorDefecto,
          tipo,
          valor,
        });
      }

      fila++; // pasamos a revisar la siguiente fila
    }

    return encontrados;
  }

  /** Lee el Excel seleccionado usando el formato de la plantilla "Control de
   *  tus finanzas" (3 columnas: Ingresos, Gastos fijos, Gastos hormiga) y
   *  separa los movimientos válidos de las filas con errores, sin guardarlos
   *  todavía (eso pasa después, cuando el usuario confirma en el modal). */
  validarImportacion(): void {
    const archivo = this.archivoSeleccionado();
    if (!archivo) {
      this.emitirMensaje('error', 'Selecciona un archivo Excel antes de validar.');
      return;
    }

    const lector = new FileReader();
    lector.onload = (evento) => {
      try {
        const datos = evento.target?.result;
        const libro = XLSX.read(datos, { type: 'array' });
        const hoja = libro.Sheets[libro.SheetNames[0]];

        // Una sola lista de errores compartida entre las 3 columnas, para
        // mostrarle al usuario todos los problemas juntos al final.
        const errores: ErrorImportacion[] = [];

        const ingresos = this.leerColumna(hoja, 'D', 'E', 'ingreso', 'Otros ingresos', errores);
        const gastosFijos = this.leerColumna(hoja, 'H', 'I', 'gasto', 'Otros', errores);
        const gastosHormiga = this.leerColumna(hoja, 'L', 'M', 'gasto', 'Gastos hormiga', errores);

        this.resultadoImportacion.set({
          validos: [...ingresos, ...gastosFijos, ...gastosHormiga],
          errores,
        });
      } catch {
        this.emitirMensaje('error', 'No se pudo leer el archivo. Verifica que sea un .xlsx con el formato de la plantilla.');
      }
    };

    lector.readAsArrayBuffer(archivo);
  }

  /** Agrega al service compartido solo los registros que pasaron la validación. */
  confirmarImportacion(): void {
    const resultado = this.resultadoImportacion();
    if (!resultado || resultado.validos.length === 0) return;
    this.finanzasService.agregarMovimientos(resultado.validos);
    console.log('[Libro mayor] Movimientos importados desde Excel:', {
      cantidad: resultado.validos.length,
      movimientos: resultado.validos,
    });
    this.emitirMensaje('exito', `${resultado.validos.length} movimiento(s) importado(s) correctamente.`);
    this.cerrarImportador();
  }
}
