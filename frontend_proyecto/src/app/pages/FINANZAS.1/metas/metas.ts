import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';

interface Meta {
  id: number;
  nombre: string;
  actual: number;
  objetivo: number;
  cumplida: boolean;
  notaPrincipal: string;
  notaSecundaria: string;
}

@Component({
  selector: 'app-metas',
  imports: [FormsModule, FinanzasMenuComponent],
  templateUrl: './metas.html',
  styleUrl: './metas.css',
})
export class MetasComponent {
  /** Estadística mostrada tal como en la referencia (no se deriva del arreglo) */
  metasAlcanzadas = 3;
  totalMetas = 4;

  private siguienteIdMeta = 100;

  metas: Meta[] = [
    {
      id: 1,
      nombre: 'Ahorro Vacaciones',
      actual: 3600000,
      objetivo: 5000000,
      cumplida: false,
      notaPrincipal: 'Meta alcanzada en 4 meses',
      notaSecundaria: '$3.600.000 / mes',
    },
    {
      id: 2,
      nombre: 'Fondo de Emergencia',
      actual: 4700000,
      objetivo: 8000000,
      cumplida: false,
      notaPrincipal: 'Ahorro mensual $3.000.000',
      notaSecundaria: '20 meses restantes',
    },
    {
      id: 3,
      nombre: 'Comprar Nueva Laptop',
      actual: 3000000,
      objetivo: 3000000,
      cumplida: true,
      notaPrincipal: 'Cumplida Febrero 2023',
      notaSecundaria: 'Duración 6 meses',
    },
    {
      id: 4,
      nombre: 'Comprar Un Auto',
      actual: 300000,
      objetivo: 20000000,
      cumplida: false,
      notaPrincipal: '$400.000 / mes',
      notaSecundaria: 'Meta alcanzada en Abr 2028',
    },
  ];

  get totalAhorrado(): number {
    return this.metas.reduce((suma, m) => suma + m.actual, 0);
  }

  get totalObjetivo(): number {
    return this.metas.reduce((suma, m) => suma + m.objetivo, 0);
  }

  get progresoGeneral(): number {
    return Math.round((this.totalAhorrado / this.totalObjetivo) * 100);
  }

  progresoMeta(meta: Meta): number {
    return Math.min(100, Math.round((meta.actual / meta.objetivo) * 100));
  }

  formatearCOP(valor: number): string {
    return `$${valor.toLocaleString('es-CO')}`;
  }

  masOpciones(): void {
    // Punto de extensión: menú de opciones (editar, eliminar, ordenar, etc.)
  }

  /** ----- Formulario de nueva meta (funcional) ----- */
  mostrarFormularioMeta = signal(false);

  nombreNuevaMeta: string = '';
  objetivoNuevaMeta: number | null = null;

  toggleFormularioMeta(): void {
    this.mostrarFormularioMeta.update(v => !v);
  }

  guardarNuevaMeta(): void {
    const nombre = this.nombreNuevaMeta.trim();
    const objetivo = this.objetivoNuevaMeta;

    if (!nombre || objetivo === null || objetivo <= 0) {
      return; // validación mínima: no guarda si falta el nombre o el monto es inválido
    }

    this.metas.push({
      id: this.siguienteIdMeta++,
      nombre,
      actual: 0,
      objetivo,
      cumplida: false,
      notaPrincipal: 'Meta recién creada',
      notaSecundaria: 'Define tu aporte mensual',
    });

    this.nombreNuevaMeta = '';
    this.objetivoNuevaMeta = null;
    this.mostrarFormularioMeta.set(false);
  }
}
