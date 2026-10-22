import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../../../services/auth';
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
      this.errorMessage = 'Credenciales incorrectas. Intenta de nuevo.';
      return;
    }

    // Guardar o eliminar el correo según la opción Recordarme.
    if (this.rememberMe) {
      localStorage.setItem('financeup_email', this.email.trim());
    } else {
      localStorage.removeItem('financeup_email');
    }

    // Iniciar sesión directamente, sin pedir código 2FA.
    this.authService.completarSesion(usuario);

    this.toastService.success(`Bienvenido ${usuario.nombre}`);
    this.router.navigateByUrl('/home');
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