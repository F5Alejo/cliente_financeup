import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EducacionService } from '../../../services/educacion';
import { AuthService } from '../../../services/auth';
import { ToastService } from '../../../shared/services/toast';

@Component({
  selector: 'app-certificado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificado.html',
  styleUrl: './certificado.css',
})
export class CertificadoComponent {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly educacionService = inject(EducacionService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  private readonly cursoId = signal(this.ruta.snapshot.paramMap.get('cursoId') ?? '');

  readonly curso = computed(() => {
    this.educacionService.version();
    return this.educacionService.buscarCurso(this.cursoId());
  });

  readonly escuela = computed(() =>
    this.educacionService.escuelaDeCurso(this.cursoId())
  );

  readonly estudiante = this.authService.obtenerUsuario()?.nombre ?? 'Estudiante FinanceUp';

  readonly fecha = new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  /** Código de verificación derivado del curso, estable entre recargas. */
  readonly codigo = computed(() => {
    const base = this.cursoId().replace(/[^a-z0-9]/gi, '').toUpperCase();
    return `FU-${base.slice(0, 6)}-${String(base.length * 47).padStart(4, '0')}`;
  });

  readonly minutos = computed(() =>
    (this.curso()?.lecciones ?? []).reduce((total, l) => total + l.duracionMin, 0)
  );

  descargar(): void {
    this.toastService.info('Abriendo el diálogo de impresión para guardarlo en PDF.');
    window.print();
  }

  volverAlCurso(): void {
    this.router.navigate(['/educacion/curso', this.cursoId()]);
  }

  seguirAprendiendo(): void {
    this.router.navigate(['/educacion']);
  }
}
