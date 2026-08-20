import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {

  /** Formulario principal del componente */
  registerForm: FormGroup;

  errorMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      /** Nombre: obligatorio, mínimo 3 caracteres */
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      /** Apellido: obligatorio, mínimo 3 caracteres */
      apellido: ['', [Validators.required, Validators.minLength(3)]],
      /** Correo: obligatorio, formato de email válido */
      correo: ['', [Validators.required, Validators.email]],
      /** Contraseña: obligatoria, mínimo 8 caracteres, al menos 1 minúscula, 1 mayúscula y 1 número */
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
      ]],
      /** Confirmar contraseña: obligatoria */
      confirmarPassword: ['', Validators.required],
    }, {
      validators: this.passwordsIguales,
    });
  }

  /** Métodos get para acceder a los datos en el HTML */
  get nombre() {
    return this.registerForm.get('nombre');
  }

  get apellido() {
    return this.registerForm.get('apellido');
  }

  get correo() {
    return this.registerForm.get('correo');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmarPassword() {
    return this.registerForm.get('confirmarPassword');
  }

  /** Método para validar que las contraseñas sean iguales */
  passwordsIguales(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmarPassword = form.get('confirmarPassword')?.value;

    if (password !== confirmarPassword) {
      return { passwordsNoCoinciden: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  registroUsuario(): void {
    this.errorMessage = '';

    /** Validación si el formulario es válido */
    if (this.registerForm.invalid) {
      /** Marca todos los campos para que muestren su error */
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Formulario inválido. Por favor, completa todos los campos correctamente.';
      return;
    }

    const { nombre, apellido, correo, password } = this.registerForm.value;

    // TODO: reemplazar por llamada HTTP real al backend cuando esté listo.
    const resultado = this.authService.registrarUsuario(nombre, apellido, correo, password);

    if (!resultado.exito) {
      this.errorMessage = resultado.mensaje ?? 'No se pudo crear la cuenta.';
      return;
    }

    alert(`Usuario registrado. ¡Bienvenido ${nombre}!`);
    this.router.navigate(['/dashboard']);
  }

  registerWithGoogle(): void {
    console.log('Registro con Google');
  }

  registerWithApple(): void {
    console.log('Registro con Apple');
  }

  registerWithFacebook(): void {
    console.log('Registro con Facebook');
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}