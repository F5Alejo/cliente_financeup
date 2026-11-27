import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, Perfil } from '../../services/auth';
import { mensajeDeError } from '../../services/api';
import { ToastService } from '../../shared/services/toast';
import { fechaMaximaNacimiento } from '../../shared/utils/politica';
import { formatearFecha } from '../../shared/utils/fechas';

interface PasswordRules {
  minLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Lo que llega del MID. Como la app no usa zone.js, los datos que llegan
  // de una petición se guardan en signals para que la pantalla se actualice.
  perfil = signal<Perfil | null>(null);
  errorCarga = signal('');
  guardando = signal(false);
  cambiandoPassword = signal(false);

  // ---------- Datos personales (formulario) ----------
  nombre = '';
  apellido = '';
  telefono = '';
  ciudad = '';
  direccion = '';
  fechaNacimiento = '';
  /** El MID solo acepta mayores de edad, también al editar la fecha */
  readonly fechaMaxima = fechaMaximaNacimiento();
  readonly formatearFecha = formatearFecha;

  // ---------- Cambiar contraseña ----------
  passwordActual = '';
  passwordNueva = '';
  passwordConfirmar = '';

  rules: PasswordRules = {
    minLength: false,
    hasNumber: false,
    hasUppercase: false,
  };

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.errorCarga.set('');
    this.authService.obtenerPerfil().subscribe({
      next: (perfil) => this.llenarFormulario(perfil),
      error: (error) => this.errorCarga.set(mensajeDeError(error)),
    });
  }

  private llenarFormulario(perfil: Perfil): void {
    this.nombre = perfil.nombre;
    this.apellido = perfil.apellido;
    this.telefono = perfil.telefono;
    this.ciudad = perfil.ciudad;
    this.direccion = perfil.direccion;
    this.fechaNacimiento = perfil.fecha_nacimiento;
    this.perfil.set(perfil);
  }

  guardarPerfil(): void {
    if (this.nombre.trim().length < 3 || this.apellido.trim().length < 3) {
      this.toastService.error('El nombre y el apellido deben tener mínimo 3 letras.');
      return;
    }

    this.guardando.set(true);
    this.authService
      .actualizarPerfil({
        nombre: this.nombre.trim(),
        apellido: this.apellido.trim(),
        telefono: this.telefono.trim(),
        ciudad: this.ciudad.trim(),
        direccion: this.direccion.trim(),
        fecha_nacimiento: this.fechaNacimiento,
      })
      .subscribe({
        next: (perfil) => {
          this.guardando.set(false);
          this.llenarFormulario(perfil);
          this.toastService.success('Datos personales actualizados.');
        },
        error: (error) => {
          this.guardando.set(false);
          this.toastService.error(mensajeDeError(error));
        },
      });
  }

  onPasswordNuevaInput(): void {
    this.rules = {
      minLength: this.passwordNueva.length >= 8,
      hasNumber: /\d/.test(this.passwordNueva),
      hasUppercase: /[A-Z]/.test(this.passwordNueva),
    };
  }

  get todasLasReglasCumplidas(): boolean {
    return this.rules.minLength && this.rules.hasNumber && this.rules.hasUppercase;
  }

  cambiarPassword(): void {
    if (!this.passwordActual) {
      this.toastService.error('Escribe tu contraseña actual.');
      return;
    }

    if (!this.todasLasReglasCumplidas) {
      this.toastService.error('La nueva contraseña no cumple con todos los requisitos.');
      return;
    }

    if (this.passwordNueva !== this.passwordConfirmar) {
      this.toastService.error('Las contraseñas no coinciden.');
      return;
    }

    this.cambiandoPassword.set(true);
    this.authService.cambiarContrasena(this.passwordActual, this.passwordNueva).subscribe({
      next: () => {
        this.cambiandoPassword.set(false);
        this.passwordActual = '';
        this.passwordNueva = '';
        this.passwordConfirmar = '';
        this.rules = { minLength: false, hasNumber: false, hasUppercase: false };
        this.toastService.success('Contraseña actualizada.');
      },
      error: (error) => {
        this.cambiandoPassword.set(false);
        this.toastService.error(mensajeDeError(error));
      },
    });
  }
}
