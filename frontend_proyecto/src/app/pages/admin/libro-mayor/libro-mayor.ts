import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/services/toast';

export interface FilaLibroAdmin {
  id: number;
  fecha: string;
  concepto: string;
  categoria: string;
  ingreso: number;
  egreso: number;
}

export interface LibroDeUsuario {
  usuarioId: number;
  nombreUsuario: string;
  filas: FilaLibroAdmin[];
}

/** Punto de extensión: esto debería venir de un servicio (ej. LibroMayorService)
 *  que consulte el backend por todos los libros mayores de los usuarios.
 *  Se deja como datos de ejemplo para no bloquear el resto de la UI admin. */
const LIBROS_EJEMPLO: LibroDeUsuario[] = [
  {
    usuarioId: 1,
    nombreUsuario: 'Sharith R.',
    filas: [
      { id: 1, fecha: '2026-08-01', concepto: 'Pago cliente Quimiaroma', categoria: 'Ventas', ingreso: 1850000, egreso: 0 },
      { id: 2, fecha: '2026-08-05', concepto: 'Arriendo oficina', categoria: 'Fijo', ingreso: 0, egreso: 620000 },
      { id: 3, fecha: '2026-08-12', concepto: 'Servicios (luz, internet)', categoria: 'Variable', ingreso: 0, egreso: 245000 },
    ],
  },
  {
    usuarioId: 2,
    nombreUsuario: 'Camilo T.',
    filas: [
      { id: 1, fecha: '2026-08-03', concepto: 'Nómina', categoria: 'Ingreso fijo', ingreso: 2200000, egreso: 0 },
      { id: 2, fecha: '2026-08-10', concepto: 'Mercado', categoria: 'Variable', ingreso: 0, egreso: 380000 },
    ],
  },
];

@Component({
  selector: 'app-admin-libro-mayor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './libro-mayor.html',
  styleUrl: './libro-mayor.css',
})
export class AdminLibroMayorComponent {
  constructor(private toastService: ToastService) {}

  libros = signal<LibroDeUsuario[]>(LIBROS_EJEMPLO);

  usuarioSeleccionadoId = signal<number>(LIBROS_EJEMPLO[0]?.usuarioId ?? 0);

  libroSeleccionado = computed(() =>
    this.libros().find(l => l.usuarioId === this.usuarioSeleccionadoId()) ?? null
  );

  seleccionarUsuario(id: number): void {
    this.usuarioSeleccionadoId.set(id);
  }

  /** ----- Totales del usuario seleccionado ----- */
  totalIngresosUsuario = computed(() =>
    (this.libroSeleccionado()?.filas ?? []).reduce((s, f) => s + f.ingreso, 0)
  );
  totalEgresosUsuario = computed(() =>
    (this.libroSeleccionado()?.filas ?? []).reduce((s, f) => s + f.egreso, 0)
  );
  resultadoUsuario = computed(() => this.totalIngresosUsuario() - this.totalEgresosUsuario());

  /** ----- Totales agregados de toda la plataforma ----- */
  totalIngresosPlataforma = computed(() =>
    this.libros().reduce((s, l) => s + l.filas.reduce((s2, f) => s2 + f.ingreso, 0), 0)
  );
  totalEgresosPlataforma = computed(() =>
    this.libros().reduce((s, l) => s + l.filas.reduce((s2, f) => s2 + f.egreso, 0), 0)
  );
  usuariosActivos = computed(() => this.libros().length);

  exportarLibro(): void {
    const libro = this.libroSeleccionado();
    if (!libro) return;
    // Punto de extensión: generar el archivo real (xlsx/csv) en vez de solo notificar.
    this.toastService.success(`Exportando el libro mayor de ${libro.nombreUsuario}…`);
  }

  exportarConsolidado(): void {
    this.toastService.success('Exportando el consolidado de todos los usuarios…');
  }

  formatearCOP(valor: number): string {
    return `$${Math.round(valor).toLocaleString('es-CO')}`;
  }
}