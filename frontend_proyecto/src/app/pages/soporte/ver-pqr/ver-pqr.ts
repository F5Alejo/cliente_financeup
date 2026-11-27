import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DetallePqr, PqrService } from '../../../services/pqr';
import { mensajeDeError } from '../../../services/api';
import { ToastService } from '../../../shared/services/toast';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';
import { MedidorComponent } from '../../../shared/graficas/medidor';

@Component({
  selector: 'app-ver-pqr',
  imports: [CommonModule, FormsModule, BandaSeccionComponent, IconComponent, MedidorComponent],
  templateUrl: './ver-pqr.html',
  styleUrl: './ver-pqr.css',
})
export class VerPqrComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pqrService = inject(PqrService);
  private toastService = inject(ToastService);

  // ===== PQR actual (se pide al MID con el radicado de la ruta) =====
  readonly pqr = signal<DetallePqr | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');

  // Caja para que el usuario escriba en su caso
  mensaje = '';
  readonly enviando = signal(false);

  // ===== Textos fijos de la interfaz =====
  textoVolver: string = 'Volver a mis PQR';
  labelDescripcion: string = 'Lo que nos contaste';

  textoBotonEnviar: string = 'Radicar otra PQR';

  constructor() {
    this.cargar();
  }

  cargar(): void {
    const radicado = this.route.snapshot.paramMap.get('numero') ?? '';
    this.cargando.set(true);
    this.error.set('');

    this.pqrService.verPqr(radicado).subscribe({
      next: (pqr) => {
        this.pqr.set(pqr);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  /** El color del distintivo cambia según el estado del caso. */
  obtenerClaseEstado(): string {
    switch (this.pqr()?.estado) {
      case 'Abierta':
      case 'En revisión':
        return 'estado-amarillo';
      case 'Resuelta':
      case 'Cerrada':
        return 'estado-verde';
      case 'Rechazada':
        return 'estado-rojo';
      default:
        return 'estado-gris';
    }
  }

  /** 2048 → "2 KB" */
  tamano(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  /** Una PQR cerrada o rechazada ya no recibe mensajes. */
  puedeResponder(): boolean {
    const estado = this.pqr()?.estado;
    return estado !== 'Cerrada' && estado !== 'Rechazada';
  }

  responder(): void {
    const pqr = this.pqr();
    const texto = this.mensaje.trim();
    if (!pqr || !texto) return;

    this.enviando.set(true);
    this.pqrService.responder(pqr.id, texto).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mensaje = '';
        this.toastService.success('Mensaje enviado al asesor.');
        this.cargar();
      },
      error: (error) => {
        this.enviando.set(false);
        this.toastService.error(mensajeDeError(error));
      },
    });
  }

  volver(): void {
    this.router.navigate(['/pqr']);
  }

  enviarNuevoPqr(): void {
    this.router.navigate(['/nuevo-pqr']);
  }
}
