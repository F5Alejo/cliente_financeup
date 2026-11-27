import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { mensajeDeError } from '../../../services/api';
import { ToastService } from '../../../shared/services/toast';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';
import { VERSION_POLITICA, VIGENCIA_POLITICA } from '../../../shared/utils/politica';

/**
 * Primer ingreso de un usuario que no aceptó la política vigente: cuentas creadas por el admin,
 * con Google, o cuando la política cambia de versión. Sin aceptarla no entra a la app.
 */
@Component({
  selector: 'app-aceptar-politica',
  standalone: true,
  imports: [FormsModule, RouterLink, BandaSeccionComponent, IconComponent],
  templateUrl: './aceptar-politica.html',
  styleUrl: '../acceso.css',
})
export class AceptarPoliticaComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  readonly version = VERSION_POLITICA;
  readonly vigencia = VIGENCIA_POLITICA;
  readonly nombre = this.authService.obtenerNombre();

  acepta = false;
  intentoSinMarcar = signal(false);
  errorMessage = signal('');
  cargando = signal(false);

  aceptar(): void {
    this.errorMessage.set('');
    if (!this.acepta) {
      this.intentoSinMarcar.set(true);
      document.getElementById('pol-acepta')?.focus();
      return;
    }

    this.cargando.set(true);
    this.authService.aceptarPolitica().subscribe({
      next: () => {
        this.cargando.set(false);
        this.toastService.success('Listo, ya puedes usar FinanceUp.');
        this.router.navigateByUrl('/home');
      },
      error: (error) => {
        this.cargando.set(false);
        this.errorMessage.set(mensajeDeError(error));
      },
    });
  }

  /** Sin autorización no hay cuenta que usar: cierra la sesión. */
  salir(): void {
    this.authService.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
