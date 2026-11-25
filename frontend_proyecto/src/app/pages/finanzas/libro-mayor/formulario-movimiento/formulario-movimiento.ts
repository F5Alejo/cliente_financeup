import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormField, FormRoot, form, maxLength, required, validate } from '@angular/forms/signals';
import { ModalComponent } from '../../../../shared/components/modal/modal';
import { MonedaPipe } from '../../../../pipes/moneda.pipe';
import { Movimiento } from '../../../../services/finanzas';

export type DatosMovimiento = Omit<Movimiento, 'id'>;
type Tipo = Movimiento['tipo'];

const CATEGORIAS: Record<Tipo, string[]> = {
  gasto: [
    'Alimentación', 'Vivienda', 'Transporte', 'Servicios', 'Salud', 'Educación',
    'Entretenimiento', 'Gastos hormiga', 'Ahorro', 'Otros',
  ],
  ingreso: ['Salario', 'Otros ingresos'],
};

const METODOS_PAGO = ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Transferencia', 'Otro'];

/** Deja solo los dígitos: "1.850.000" → 1850000. */
function aNumero(texto: string): number {
  const digitos = texto.replace(/\D/g, '');
  return digitos ? Number(digitos) : 0;
}

/** 1850000 → "1.850.000" (sin símbolo; el "$" va fuera del campo). */
function conMiles(valor: number): string {
  return valor > 0 ? valor.toLocaleString('es-CO', { maximumFractionDigits: 0 }) : '';
}

/** Fecha local de hoy en YYYY-MM-DD (toISOString usaría UTC y en la noche daría mañana). */
function hoy(): string {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/**
 * Formulario para registrar o editar un movimiento del Libro mayor.
 * Usa Signal Forms: el modelo es un signal y las reglas viven en el esquema.
 * No guarda nada por sí mismo: emite `guardar` con los datos ya limpios.
 */
@Component({
  selector: 'app-formulario-movimiento',
  imports: [FormField, FormRoot, ModalComponent, MonedaPipe],
  templateUrl: './formulario-movimiento.html',
  styleUrl: './formulario-movimiento.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioMovimientoComponent {
  /** Si llega, el formulario edita ese movimiento; si no, crea uno nuevo. */
  movimiento = input<Movimiento>();
  guardar = output<DatosMovimiento>();
  cerrar = output<void>();

  protected readonly metodosPago = METODOS_PAGO;
  protected readonly enEdicion = computed(() => this.movimiento() !== undefined);

  protected readonly modelo = signal({
    tipo: 'gasto' as Tipo,
    valor: '',
    concepto: '',
    fecha: hoy(),
    categoria: CATEGORIAS.gasto[0],
    metodoPago: METODOS_PAGO[0],
    observaciones: '',
  });

  protected readonly formulario = form(
    this.modelo,
    (c) => {
      validate(c.valor, ({ value }) =>
        aNumero(value()) > 0 ? undefined : { kind: 'min', message: 'Escribe un valor mayor a $ 0.' },
      );
      required(c.concepto, { message: 'Escribe en qué se fue o de dónde vino el dinero.' });
      maxLength(c.concepto, 80, { message: 'Usa máximo 80 caracteres.' });
      required(c.fecha, { message: 'Elige la fecha del movimiento.' });
      maxLength(c.observaciones, 200, { message: 'Usa máximo 200 caracteres.' });
    },
    {
      submission: {
        action: async () => {
          const m = this.modelo();
          this.guardar.emit({
            tipo: m.tipo,
            valor: aNumero(m.valor),
            concepto: m.concepto.trim(),
            fecha: m.fecha,
            categoria: m.categoria,
            metodoPago: m.metodoPago,
            observaciones: m.observaciones.trim(),
          });
        },
        onInvalid: () => this.enfocarPrimerError(),
      },
    },
  );

  /** Categorías del tipo elegido; en edición conserva la del movimiento aunque no esté en la lista. */
  protected readonly categorias = computed(() => {
    const tipo = this.modelo().tipo;
    const lista = CATEGORIAS[tipo];
    const original = this.movimiento();
    return original && original.tipo === tipo && !lista.includes(original.categoria)
      ? [original.categoria, ...lista]
      : lista;
  });

  protected readonly valorNumerico = computed(() => aNumero(this.modelo().valor));

  constructor() {
    // Al abrir en edición, el modelo toma los datos del movimiento.
    effect(() => {
      const m = this.movimiento();
      if (!m) return;
      this.modelo.set({
        tipo: m.tipo,
        valor: conMiles(m.valor),
        concepto: m.concepto,
        fecha: m.fecha,
        categoria: m.categoria,
        metodoPago: m.metodoPago || METODOS_PAGO[0],
        observaciones: m.observaciones ?? '',
      });
    });

    // Si cambia el tipo y la categoría ya no aplica, se pasa a la primera del nuevo tipo.
    effect(() => {
      const lista = this.categorias();
      const actual = this.modelo().categoria;
      if (!lista.includes(actual)) {
        this.modelo.update((m) => ({ ...m, categoria: lista[0] }));
      }
    });
  }

  /** Reescribe el campo con puntos de miles mientras se teclea. */
  protected formatearValor(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const formateado = conMiles(aNumero(campo.value));
    campo.value = formateado;
    this.modelo.update((m) => ({ ...m, valor: formateado }));
  }

  /** Mensaje del primer error de un campo, solo si ya lo tocaron (o se intentó guardar). */
  protected error(campo: 'valor' | 'concepto' | 'fecha' | 'observaciones'): string {
    const estado = this.formulario[campo]();
    return estado.touched() && estado.invalid() ? (estado.errors()[0]?.message ?? '') : '';
  }

  private enfocarPrimerError(): void {
    const orden = ['valor', 'concepto', 'fecha', 'observaciones'] as const;
    const primero = orden.find((c) => this.formulario[c]().invalid());
    if (primero) this.formulario[primero]().focusBoundControl();
  }
}
