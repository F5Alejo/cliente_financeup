import { Component } from '@angular/core';
import { FinanzasMenuComponent } from '../finanzas-menu/finanzas-menu';

interface Meta {
  nombre: string;
  icono: string;
  porcentaje: number;
  actual: number;
  objetivo: number;
}

@Component({
  selector: 'app-metas',
  imports: [FinanzasMenuComponent],
  templateUrl: './metas.html',
  styleUrl: './metas.css',
})
export class Metas {
  radioAnillo = 30;
  circunferencia = 2 * Math.PI * this.radioAnillo;

  metas: Meta[] = [
    { nombre: 'Vacaciones', icono: '✈️', porcentaje: 72, actual: 1800000, objetivo: 2500000 },
    { nombre: 'Emergencia', icono: '🛟', porcentaje: 40, actual: 800000, objetivo: 2000000 },
    { nombre: 'Educación', icono: '🎓', porcentaje: 100, actual: 5000000, objetivo: 5000000 },
    { nombre: 'Auto', icono: '🚙', porcentaje: 25, actual: 1250000, objetivo: 5000000 },
    { nombre: 'Casa propia', icono: '🏠', porcentaje: 12, actual: 6000000, objetivo: 50000000 },
    { nombre: 'Viaje fin de año', icono: '🌴', porcentaje: 55, actual: 1100000, objetivo: 2000000 },
  ];

  obtenerOffset(porcentaje: number): number {
    return this.circunferencia * (1 - porcentaje / 100);
  }

  formatearCOP(valor: number): string {
    return `$${valor.toLocaleString('es-CO')}`;
  }

  nuevaMeta(): void {
    // Punto de extensión: abrir el formulario/modal de nueva meta
  }
}
