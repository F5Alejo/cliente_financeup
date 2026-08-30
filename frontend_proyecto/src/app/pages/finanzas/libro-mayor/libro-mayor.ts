import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router'; // para el enlace "Ver mis deudas" (routerLink)
import * as XLSX from 'xlsx'; // Librería para leer/escribir archivos Excel (.xlsx) en el navegador
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';
import { CursoBannerComponent } from '../../../shared/components/curso-banner/curso-banner';

/**
 * COMPONENTE: Libro Mayor
 * ------------------------------------------------------------------
 * Le permite al usuario llevar el control de sus movimientos de dinero
 * (ingresos y gastos): agregarlos a mano, editarlos, borrarlos, filtrarlos,
 * exportarlos a Excel, o importarlos masivamente desde un archivo Excel.
 *
 * Angular usa "signals" (la función `signal(...)`) para guardar valores que
 * cambian con el tiempo. Un signal se LEE llamándolo como función (`algo()`)
 * y se ACTUALIZA con `.set(valor)` o `.update(fn)`. Cuando un signal cambia,
 * Angular vuelve a dibujar automáticamente la parte del HTML que lo usa.
 * ------------------------------------------------------------------
 */

/** Un movimiento individual del libro mayor (una fila de la tabla).
 *  metodoPago y observaciones son opcionales ("?") porque los movimientos
 *  importados desde Excel no los traen (la plantilla no tiene esas columnas). */
interface Movimiento {
  id: number;
  fecha: string; // formato YYYY-MM-DD
  concepto: string;
  categoria: string;
  tipo: 'ingreso' | 'gasto';
  valor: number;
  metodoPago?: string;
  observaciones?: string;
}

/** Describe por qué una fila del Excel importado NO se pudo usar. */
interface ErrorImportacion {
  fila: number;
  motivo: string;
}

/** Columnas por las que se puede ordenar la tabla. */
type ColumnaOrden = 'fecha' | 'concepto' | 'categoria' | 'tipo' | 'valor';

@Component({
  selector: 'app-libro-mayor',
  imports: [FinanzasMenuComponent, FormsModule, RouterLink, CursoBannerComponent],
  templateUrl: './libro-mayor.html',
  styleUrl: './libro-mayor.css',
})
export class LibroMayorComponent {
  /** Categorías que el usuario puede elegir tanto en el formulario como en los filtros. */
  categoriasDisponibles: string[] = [
    'Vivienda', 'Alimentación', 'Transporte', 'Salud', 'Entretenimiento',
    'Servicios', 'Educación', 'Gastos hormiga', 'Salario', 'Otros ingresos',
    'Ahorro', 'Otros',
  ];

  /** Opciones para el campo "Método de pago" del formulario. */
  metodosPago: string[] = ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Transferencia', 'Otro'];

  // Contador simple para generar IDs únicos de movimientos nuevos.
  // (En una app real, el ID lo asignaría el backend/base de datos).
  private siguienteId = 100;

  // Datos de ejemplo, para que la pantalla no se vea vacía la primera vez.
  movimientos: Movimiento[] = [
    { id: 1, fecha: '2026-03-01', concepto: 'Salario', categoria: 'Salario', tipo: 'ingreso', valor: 3000000 },
    { id: 2, fecha: '2026-03-02', concepto: 'Arriendo', categoria: 'Vivienda', tipo: 'gasto', valor: 1200000 },
    { id: 3, fecha: '2026-03-03', concepto: 'Mercado', categoria: 'Alimentación', tipo: 'gasto', valor: 450000 },
    { id: 4, fecha: '2026-03-05', concepto: 'Café diario', categoria: 'Gastos hormiga', tipo: 'gasto', valor: 60000 },
    { id: 5, fecha: '2026-03-10', concepto: 'Freelance diseño', categoria: 'Otros ingresos', tipo: 'ingreso', valor: 500000 },
  ];

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

  /** Da formato de pesos colombianos a un número, ej: 1200000 -> "$1.200.000". */
  formatearCOP(valor: number): string {
    return `$${Math.abs(valor).toLocaleString('es-CO')}`;
  }

  /** ----- Formulario de agregar / editar -----
   *  Un mismo formulario (y un mismo modal) sirve tanto para crear un
   *  movimiento nuevo como para editar uno existente; `modoEdicion` indica
   *  en cuál de los dos casos estamos. */
  mostrarFormulario = signal(false);
  modoEdicion = signal(false);
  private idEnEdicion: number | null = null;

  formFecha = '';
  formConcepto = '';
  formCategoria = 'Otros';
  formTipo: 'ingreso' | 'gasto' = 'gasto';
  formValor: number | null = null;
  formMetodoPago = 'Efectivo';
  formObservaciones = '';

  /** Abre el modal limpio, listo para crear un movimiento nuevo. */
  abrirFormularioNuevo(): void {
    this.modoEdicion.set(false);
    this.idEnEdicion = null;
    this.formFecha = '';
    this.formConcepto = '';
    this.formCategoria = 'Otros';
    this.formTipo = 'gasto';
    this.formValor = null;
    this.formMetodoPago = 'Efectivo';
    this.formObservaciones = '';
    this.mostrarFormulario.set(true);
  }

  /** Abre el modal con los datos del movimiento ya cargados, para editarlo. */
  abrirFormularioEditar(movimiento: Movimiento): void {
    this.modoEdicion.set(true);
    this.idEnEdicion = movimiento.id;
    this.formFecha = movimiento.fecha;
    this.formConcepto = movimiento.concepto;
    this.formCategoria = movimiento.categoria;
    this.formTipo = movimiento.tipo;
    this.formValor = movimiento.valor;
    this.formMetodoPago = movimiento.metodoPago ?? 'Efectivo';
    this.formObservaciones = movimiento.observaciones ?? '';
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
  }

  /** Valida el formulario y, según `modoEdicion`, actualiza el movimiento
   *  existente o agrega uno nuevo al arreglo `movimientos`. */
  guardarMovimiento(): void {
    const concepto = this.formConcepto.trim();
    const fecha = this.formFecha;
    const valor = this.formValor;

    if (!concepto || !fecha || valor === null || valor <= 0) {
      this.emitirMensaje('error', 'Completa fecha, concepto y un valor mayor a 0.');
      return;
    }

    if (this.modoEdicion() && this.idEnEdicion !== null) {
      const movimiento = this.movimientos.find(m => m.id === this.idEnEdicion);
      if (movimiento) {
        movimiento.fecha = fecha;
        movimiento.concepto = concepto;
        movimiento.categoria = this.formCategoria;
        movimiento.tipo = this.formTipo;
        movimiento.valor = valor;
        movimiento.metodoPago = this.formMetodoPago;
        movimiento.observaciones = this.formObservaciones.trim();
      }
      this.emitirMensaje('exito', 'Movimiento actualizado correctamente.');
    } else {
      this.movimientos.push({
        id: this.siguienteId++,
        fecha,
        concepto,
        categoria: this.formCategoria,
        tipo: this.formTipo,
        valor,
        metodoPago: this.formMetodoPago,
        observaciones: this.formObservaciones.trim(),
      });
      this.emitirMensaje('exito', 'Movimiento agregado correctamente.');
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
    this.movimientos = this.movimientos.filter(m => m.id !== id);
    this.idAEliminar.set(null);
    this.emitirMensaje('exito', 'Movimiento eliminado.');
  }

  /** ----- Mensajes de éxito / error (toast) -----
   *  Se muestra un mensaje arriba de la página y se oculta solo a los 3 segundos. */
  mensaje = signal<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  private temporizadorMensaje: ReturnType<typeof setTimeout> | undefined;

  private emitirMensaje(tipo: 'exito' | 'error', texto: string): void {
    this.mensaje.set({ tipo, texto });
    clearTimeout(this.temporizadorMensaje); // evita que un mensaje anterior lo cierre antes de tiempo
    this.temporizadorMensaje = setTimeout(() => this.mensaje.set(null), 3000);
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
  resultadoImportacion = signal<{ validos: Movimiento[]; errores: ErrorImportacion[] } | null>(null);

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
  ): Movimiento[] {
    const encontrados: Movimiento[] = [];
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
          id: this.siguienteId++,
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

  /** Agrega a `movimientos` solo los registros que pasaron la validación. */
  confirmarImportacion(): void {
    const resultado = this.resultadoImportacion();
    if (!resultado || resultado.validos.length === 0) return;
    this.movimientos.push(...resultado.validos);
    this.emitirMensaje('exito', `${resultado.validos.length} movimiento(s) importado(s) correctamente.`);
    this.cerrarImportador();
  }
}
