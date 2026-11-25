import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { mensajeDeError } from '../../../services/api';
import { ToastService } from '../../../shared/services/toast';

type LoginStage = 'credenciales' | 'verificacion';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  codigo = '';

  // Cambian cuando responde el MID, por eso son signals (la app no usa zone.js)
  stage = signal<LoginStage>('credenciales');
  errorMessage = signal('');
  cargando = signal(false);

  /** Token temporal que da el MID en el paso 1; se usa para verificar o reenviar el código. */
  private tokenVerificacion = '';

  constructor() {
    // Si el usuario marcó "Recordarme" antes, precargamos su correo
    const emailGuardado = localStorage.getItem('financeup_email');
    if (emailGuardado) {
      this.email = emailGuardado;
      this.rememberMe = true;
    }
  }

  /** Paso 1: el MID revisa correo y contraseña y manda el código al correo. */
  login(): void {
    this.errorMessage.set('');
    this.cargando.set(true);

    this.authService.iniciarSesion(this.email.trim(), this.password).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.tokenVerificacion = respuesta.token_verificacion;
        this.codigo = '';
        this.stage.set('verificacion');
        this.toastService.info(respuesta.mensaje);
      },
      error: (error) => {
        this.cargando.set(false);
        this.errorMessage.set(mensajeDeError(error));
      },
    });
  }

  /** Paso 2: con el código correcto el MID entrega el token y entramos. */
  verificarCodigo(): void {
    this.cargando.set(true);

    this.authService.verificarCodigo(this.tokenVerificacion, this.codigo.trim()).subscribe({
      next: (usuario) => {
        this.cargando.set(false);
        if (this.rememberMe) {
          localStorage.setItem('financeup_email', this.email.trim());
        } else {
          localStorage.removeItem('financeup_email');
        }
        this.toastService.success(`Bienvenido ${usuario.nombre}`);
        this.router.navigateByUrl(usuario.rol === 'admin' ? '/admin' : '/home');
      },
      error: (error) => {
        this.cargando.set(false);
        this.codigo = '';
        this.toastService.error(mensajeDeError(error));
      },
    });
  }

  reenviarCodigo(): void {
    this.authService.reenviarCodigo(this.tokenVerificacion).subscribe({
      next: (respuesta) => this.toastService.info(respuesta.mensaje),
      error: (error) => this.toastService.error(mensajeDeError(error)),
    });
  }

  volverACredenciales(): void {
    this.stage.set('credenciales');
    this.tokenVerificacion = '';
    this.codigo = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  loginWithGoogle(): void {
    console.log('[Login] Inicio de sesión con Google');
  }

  loginWithApple(): void {
    console.log('[Login] Inicio de sesión con Apple');
  }

  loginWithFacebook(): void {
    console.log('[Login] Inicio de sesión con Facebook');
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/recuperar-contrasena']);
  }
}
