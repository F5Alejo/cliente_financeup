import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { mensajeDeError } from '../../../services/api';
import { ToastService } from '../../../shared/services/toast';

// Pasos: 1) escribir el correo, 2) código + clave nueva, 3) listo
type Paso = 'correo' | 'codigo' | 'listo';

interface PasswordRules {
  minLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
}

@Component({
  selector: 'app-recuperar-contrasena',
  imports: [FormsModule],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.css',
})
export class RecuperarContrasena {
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Signals: la pantalla cambia cuando responde el MID (la app no usa zone.js)
  paso = signal<Paso>('correo');
  errorMessage = signal('');
  cargando = signal(false);

  email = '';
  codigo = '';
  nuevaPassword = '';
  confirmarPassword = '';

  rules: PasswordRules = {
    minLength: false,
    hasNumber: false,
    hasUppercase: false,
  };

  // ---------- Paso 1: pedir el código ----------

  enviarCodigo(): void {
    this.errorMessage.set('');
    if (!this.email.trim()) {
      this.errorMessage.set('Escribe el correo con el que te registraste.');
      return;
    }

    this.cargando.set(true);
    this.authService.pedirCodigoRecuperacion(this.email.trim()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.paso.set('codigo');
        // El MID responde igual exista o no el correo, para no revelar qué cuentas hay
        this.toastService.success('Si el correo está registrado, te llegará un código.');
      },
      error: (error) => {
        this.cargando.set(false);
        this.errorMessage.set(mensajeDeError(error));
      },
    });
  }

  // ---------- Paso 2: código y contraseña nueva ----------

  onPasswordInput(): void {
    this.rules = {
      minLength: this.nuevaPassword.length >= 8,
      hasNumber: /\d/.test(this.nuevaPassword),
      hasUppercase: /[A-Z]/.test(this.nuevaPassword),
    };
  }

  get allRulesPassed(): boolean {
    return this.rules.minLength && this.rules.hasNumber && this.rules.hasUppercase;
  }

  guardarPassword(): void {
    this.errorMessage.set('');

    if (!/^\d{6}$/.test(this.codigo.trim())) {
      this.errorMessage.set('El código tiene 6 dígitos.');
      return;
    }
    if (!this.allRulesPassed) {
      this.errorMessage.set('La contraseña no cumple con todos los requisitos.');
      return;
    }
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.cargando.set(true);
    this.authService.restablecerContrasena(this.email.trim(), this.codigo.trim(), this.nuevaPassword).subscribe({
      next: () => {
        this.cargando.set(false);
        this.paso.set('listo');
      },
      error: (error) => {
        this.cargando.set(false);
        this.errorMessage.set(mensajeDeError(error));
      },
    });
  }

  volverAlCorreo(): void {
    this.errorMessage.set('');
    this.codigo = '';
    this.paso.set('correo');
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
