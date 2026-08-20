import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  constructor(private router: Router, private authService: AuthService) {
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

  login(): void {
    this.errorMessage = '';

    const autenticado = this.authService.iniciarSesion(this.email.trim(), this.password);

    if (!autenticado) {
      this.errorMessage = 'Credenciales incorrectas. Intenta de nuevo.';
      return;
    }

    if (this.rememberMe) {
      localStorage.setItem('financeup_email', this.email.trim());
    } else {
      localStorage.removeItem('financeup_email');
    }

    const usuario = this.authService.obtenerUsuario();
    alert(`Bienvenido ${usuario?.nombre}\nrol: ${usuario?.rol}`);
    this.router.navigateByUrl('/dashboard');
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
    this.router.navigate(['/forgot-password']);
  }
  
  
}