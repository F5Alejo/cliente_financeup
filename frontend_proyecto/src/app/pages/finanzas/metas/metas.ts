import { Component } from '@angular/core';
import { FinanzasMenuComponent } from '../../FINANZAS.1/finanzas-menu/finanzas-menu';
import { MetasService } from '../../../services/metas';
import { ToastService } from '../../../shared/services/toast';
import { MonedaPipe } from '../../../pipes/moneda.pipe';

@Component({
  selector: 'app-metas',
  imports: [FinanzasMenuComponent, MonedaPipe],
  templateUrl: './metas.html',
  styleUrl: './metas.css',
})
export class Metas {
  constructor(
    private metasService: MetasService,
    private toastService: ToastService
  ) {}

  radioAnillo = 30;
  circunferencia = 2 * Math.PI * this.radioAnillo;

  get metas() {
    return this.metasService.metas;
  }

  obtenerOffset(porcentaje: number): number {
    return this.circunferencia * (1 - porcentaje / 100);
  }

  nuevaMeta(): void {
    this.metasService.agregarMeta({
      nombre: `Meta nueva ${this.metas.length + 1}`,
      icono: '🎯',
      porcentaje: 0,
      actual: 0,
      objetivo: 1000000,
    });
    this.toastService.success('Meta creada correctamente');
  }
}
