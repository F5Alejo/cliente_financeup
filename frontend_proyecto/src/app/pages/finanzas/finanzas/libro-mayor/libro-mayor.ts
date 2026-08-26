import { Component, ElementRef, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ToastService } from '../../../../shared/services/toast';
import { FinanzasMenuComponent } from '../../finanzas-menu/finanzas-menu';

/** Una fila del libro mayor. El color/fuente se guardan por fila (fila completa),
 *  que es lo que la UI de "cambiar color" / "cambiar letra" edita. */
export interface FilaLibro {
  id: number;
  fecha: string;
  concepto: string;
  categoria: string;
  ingreso: number;
  egreso: number;
  color?: string;
  fuente?: string;
}

/** Encabezados aceptados al leer un Excel externo (minúsculas, sin tildes).
 *  Cualquier variante razonable de nombre de columna se mapea al campo interno. */
const ALIAS_COLUMNAS: Record<string, keyof FilaLibro> = {
  fecha: 'fecha',
  concepto: 'concepto',
  descripcion: 'concepto',
  detalle: 'concepto',
  categoria: 'categoria',
  tipo: 'categoria',
  ingreso: 'ingreso',
  ingresos: 'ingreso',
  entrada: 'ingreso',
  egreso: 'egreso',
  egresos: 'egreso',
  gasto: 'egreso',
  salida: 'egreso',
};

@Component({
  selector: 'app-libro-mayor',
  standalone: true,
  imports: [FinanzasMenuComponent, FormsModule],
  templateUrl: './libro-mayor.html',
  styleUrl: './libro-mayor.css',
})
export class LibroMayorComponent {
  constructor(private toastService: ToastService) {}

  @ViewChild('inputArchivo') inputArchivo!: ElementRef<HTMLInputElement>;

  private siguienteId = 1;

  filas = signal<FilaLibro[]>([
    { id: this.siguienteId++, fecha: '2026-08-01', concepto: 'Pago cliente Quimiaroma', categoria: 'Ventas', ingreso: 1850000, egreso: 0 },
    { id: this.siguienteId++, fecha: '2026-08-05', concepto: 'Arriendo oficina', categoria: 'Fijo', ingreso: 0, egreso: 620000 },
    { id: this.siguienteId++, fecha: '2026-08-12', concepto: 'Servicios (luz, internet)', categoria: 'Variable', ingreso: 0, egreso: 245000 },
  ]);

  filaSeleccionada = signal<number | null>(null);

  colores = ['#dcfce7', '#fee2e2', '#fef9c3', '#e2e8f0'];
  fuentes = [
    { etiqueta: 'Por defecto', valor: 'var(--font-family-base)' },
    { etiqueta: 'Monoespaciada', valor: "'JetBrains Mono', monospace" },
    { etiqueta: 'Serif', valor: 'Georgia, serif' },
  ];

  /** ----- Totales (Ganancias y pérdidas), automáticos ----- */
  totalIngresos = computed(() => this.filas().reduce((s, f) => s + f.ingreso, 0));
  totalEgresos = computed(() => this.filas().reduce((s, f) => s + f.egreso, 0));
  resultado = computed(() => this.totalIngresos() - this.totalEgresos());

  /** ----- Gráfica automática: ingresos vs egresos por categoría ----- */
  resumenPorCategoria = computed(() => {
    const mapa = new Map<string, { ingreso: number; egreso: number }>();
    for (const f of this.filas()) {
      const actual = mapa.get(f.categoria) ?? { ingreso: 0, egreso: 0 };
      actual.ingreso += f.ingreso;
      actual.egreso += f.egreso;
      mapa.set(f.categoria, actual);
    }
    const maxValor = Math.max(1, ...Array.from(mapa.values()).map(v => Math.max(v.ingreso, v.egreso)));
    return Array.from(mapa.entries()).map(([categoria, v]) => ({
      categoria,
      ingreso: v.ingreso,
      egreso: v.egreso,
      altoIngreso: Math.round((v.ingreso / maxValor) * 100),
      altoEgreso: Math.round((v.egreso / maxValor) * 100),
    }));
  });

  /** ----- Edición de filas ----- */
  agregarFila(): void {
    this.filas.update(actual => [
      ...actual,
      { id: this.siguienteId++, fecha: '', concepto: '', categoria: '', ingreso: 0, egreso: 0 },
    ]);
  }

  eliminarFila(id: number): void {
    this.filas.update(actual => actual.filter(f => f.id !== id));
    this.toastService.info('Fila eliminada.');
  }

  /** Los inputs de fecha/concepto/categoría mutan el objeto de la fila directamente
   *  (two-way binding normal). Ingreso y egreso alimentan los totales automáticos,
   *  así que tras editarlos forzamos una nueva referencia del signal para que los
   *  `computed()` (totales, gráfica) se recalculen. */
  actualizarTotales(): void {
    this.filas.update(actual => [...actual]);
  }

  seleccionarFila(id: number): void {
    this.filaSeleccionada.set(id);
  }

  aplicarColor(color: string): void {
    const id = this.filaSeleccionada();
    if (id === null) {
      this.toastService.info('Primero selecciona una fila para cambiarle el color.');
      return;
    }
    this.filas.update(actual => actual.map(f => (f.id === id ? { ...f, color } : f)));
  }

  aplicarFuente(fuente: string): void {
    const id = this.filaSeleccionada();
    if (id === null) {
      this.toastService.info('Primero selecciona una fila para cambiarle la fuente.');
      return;
    }
    this.filas.update(actual => actual.map(f => (f.id === id ? { ...f, fuente } : f)));
  }

  /** ----- Anexar Excel: se lee el archivo y se mapean sus columnas automáticamente ----- */
  abrirSelectorArchivo(): void {
    this.inputArchivo.nativeElement.click();
  }

  async manejarArchivo(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    try {
      const buffer = await archivo.arrayBuffer();
      const libro = XLSX.read(buffer, { type: 'array' });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      const filasCrudas: Record<string, unknown>[] = XLSX.utils.sheet_to_json(hoja, { defval: '' });

      const nuevasFilas: FilaLibro[] = filasCrudas.map(fila => {
        const mapeada: Partial<FilaLibro> = {};
        for (const [llave, valor] of Object.entries(fila)) {
          const normalizada = llave.toString().trim().toLowerCase();
          const campo = ALIAS_COLUMNAS[normalizada];
          if (campo === 'ingreso' || campo === 'egreso') {
            mapeada[campo] = Number(valor) || 0;
          } else if (campo) {
            (mapeada as Record<string, unknown>)[campo] = valor?.toString() ?? '';
          }
        }
        return {
          id: this.siguienteId++,
          fecha: mapeada.fecha ?? '',
          concepto: mapeada.concepto ?? '',
          categoria: mapeada.categoria ?? 'Sin categoría',
          ingreso: mapeada.ingreso ?? 0,
          egreso: mapeada.egreso ?? 0,
        };
      });

      this.filas.update(actual => [...actual, ...nuevasFilas]);
      this.toastService.success(`${nuevasFilas.length} filas importadas desde ${archivo.name}.`);
    } catch {
      this.toastService.info('No pudimos leer ese archivo. Verifica que sea un Excel (.xlsx) válido.');
    } finally {
      input.value = '';
    }
  }

  /** ----- Calculadora de interés simple / compuesto ----- */
  modoInteres = signal<'simple' | 'compuesto'>('simple');
  capital = signal(1000000);
  tasaAnual = signal(12);
  plazoAnios = signal(3);

  actualizarCapital(valor: number): void { this.capital.set(valor); }
  actualizarTasa(valor: number): void { this.tasaAnual.set(valor); }
  actualizarPlazo(valor: number): void { this.plazoAnios.set(valor); }

  montoFinal = computed(() => {
    const c = this.capital();
    const i = this.tasaAnual() / 100;
    const t = this.plazoAnios();
    return this.modoInteres() === 'simple' ? c * (1 + i * t) : c * Math.pow(1 + i, t);
  });

  interesGenerado = computed(() => this.montoFinal() - this.capital());

  cambiarModoInteres(modo: 'simple' | 'compuesto'): void {
    this.modoInteres.set(modo);
  }

  formatearCOP(valor: number): string {
    return `$${Math.round(valor).toLocaleString('es-CO')}`;
  }
}