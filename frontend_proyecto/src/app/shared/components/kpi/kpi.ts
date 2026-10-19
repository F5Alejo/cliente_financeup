import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent, NombreIcono } from '../icon/icon';

export interface TendenciaKpi {
  texto: string;
  direccion: 'sube' | 'baja' | 'igual';
}

@Component({
  selector: 'app-kpi',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kpi.html',
  styleUrl: './kpi.css',
})
export class KpiComponent {
  etiqueta = input.required<string>();
  valor = input.required<string | number>();
  icono = input.required<NombreIcono>();
  pie = input('');
  tono = input<'' | 'neutral' | 'warning'>('');
  negativo = input(false);
  cargando = input(false);
  tendencia = input<TendenciaKpi | null>(null);
}
