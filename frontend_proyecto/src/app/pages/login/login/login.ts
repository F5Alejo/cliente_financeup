import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, motivoSinAcceso, Usuario } from '../../../services/auth';
import { ToastService } from '../../../shared/services/toast';

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
    // Recuperar el correo guardado, si el usuario marcó Recordarme.
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

  login(): void {
    this.errorMessage = '';

    const usuario = this.authService.validarCredenciales(
      this.email.trim(),
      this.password
    );

    if (!usuario) {
      console.log('[Login] Credenciales incorrectas:', { email: this.email.trim() });
      this.errorMessage = 'Credenciales incorrectas. Intenta de nuevo.';
      return;
    }

    const sinAcceso = motivoSinAcceso(usuario);
    if (sinAcceso) {
      console.log('[Login] Cuenta sin acceso:', { email: usuario.email, motivo: sinAcceso });
      this.errorMessage = sinAcceso;
      return;
    }

    console.log('[Login] Credenciales válidas, se pide el código de verificación:', { email: usuario.email });
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
      console.log('[Login] Código de verificación incorrecto:', { email: this.usuarioValidado.email });
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
    console.log('[Login] Sesión iniciada:', { email: this.usuarioValidado.email, rol: this.usuarioValidado.rol });
    this.toastService.success(`Bienvenido ${this.usuarioValidado.nombre}`);
    this.router.navigateByUrl('/home');
  }

  reenviarCodigo(): void {
    console.log('[Login] Código de verificación reenviado:', { email: this.usuarioValidado?.email });
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