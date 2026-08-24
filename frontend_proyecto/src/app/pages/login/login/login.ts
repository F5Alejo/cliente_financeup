import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../../../services/auth';
import { ToastService } from '../../../shared/services/toast';

type LoginStage = 'credenciales' | 'verificacion';

// TODO: código de verificación quemado (mock de 2FA). Reemplazar por envío/validación real por SMS o correo.
const CODIGO_2FA_MOCK = '123456';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    // Si el usuario marcó "Recordarme" antes, precargamos su correo
    const emailGuardado = localStorage.getItem('financeup_email');
    if (emailGuardado) {
      this.email = emailGuardado;
      this.rememberMe = true;
    }
  }

  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;
  errorMessage: string = '';

  stage: LoginStage = 'credenciales';
  codigo: string = '';
  private usuarioValidado: Usuario | null = null;

  login(): void {
    this.errorMessage = '';

    const usuario = this.authService.validarCredenciales(this.email.trim(), this.password);

    if (!usuario) {
      this.errorMessage = 'Credenciales incorrectas. Intenta de nuevo.';
      return;
    }

    this.usuarioValidado = usuario;
    this.codigo = '';
    this.stage = 'verificacion';
  }

  verificarCodigo(): void {
    if (!this.usuarioValidado) {
      this.stage = 'credenciales';
      return;
    }

    if (this.codigo.trim() !== CODIGO_2FA_MOCK) {
      this.toastService.error('Código incorrecto. Intenta de nuevo.');
      this.codigo = '';
      return;
    }

    if (this.rememberMe) {
      localStorage.setItem('financeup_email', this.email.trim());
    } else {
      localStorage.removeItem('financeup_email');
    }

    this.authService.completarSesion(this.usuarioValidado);
    this.toastService.success(`Bienvenido ${this.usuarioValidado.nombre}`);
    this.router.navigateByUrl('/home');
  }

  reenviarCodigo(): void {
    this.toastService.info('Código reenviado (simulado): 123456');
  }

  volverACredenciales(): void {
    this.stage = 'credenciales';
    this.usuarioValidado = null;
    this.codigo = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  loginWithGoogle(): void {
    console.log('Login con Google');
  }

  loginWithApple(): void {
    console.log('Login con Apple');
  }

  loginWithFacebook(): void {
    console.log('Login con Facebook');
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/recuperar-contrasena']);
  }
}
