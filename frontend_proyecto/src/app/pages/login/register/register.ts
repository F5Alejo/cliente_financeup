import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { mensajeDeError } from '../../../services/api';
import { ToastService } from '../../../shared/services/toast';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';
import { PATRON_CONTRASENA, Regla, reglasContrasena } from '../reglas-contrasena';
import { EDAD_MINIMA, fechaMaximaNacimiento, mayorDeEdad } from '../../../shared/utils/politica';

/** Orden de los campos en pantalla: al enviar con errores, el foco va al primero que falle. */
const CAMPOS = [
  'nombre',
  'apellido',
  'correo',
  'fechaNacimiento',
  'password',
  'confirmarPassword',
  'aceptaTerminos',
] as const;
type Campo = (typeof CAMPOS)[number];

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, BandaSeccionComponent, IconComponent],
  templateUrl: './register.html',
  styleUrl: '../acceso.css',
})
export class RegisterComponent {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  /** Formulario principal del componente */
  registerForm: FormGroup = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellido: ['', [Validators.required, Validators.minLength(3)]],
      correo: ['', [Validators.required, Validators.email]],
      /** Solo mayores de edad (el MID revisa lo mismo) */
      fechaNacimiento: ['', [Validators.required, mayorDeEdad]],
      /** Mismas reglas que el MID: 8 a 72 caracteres, una mayúscula y un número */
      password: ['', [Validators.required, Validators.pattern(PATRON_CONTRASENA)]],
      confirmarPassword: ['', Validators.required],
      aceptaTerminos: [false, Validators.requiredTrue],
    },
    { validators: this.passwordsIguales },
  );

  // Cambian cuando responde el MID, por eso son signals (la app no usa zone.js)
  errorMessage = signal('');
  cargando = signal(false);
  showPassword = false;
  showConfirmPassword = false;
  readonly edadMinima = EDAD_MINIMA;
  /** Tope del selector de fecha: quien nació después todavía no cumple la edad mínima */
  readonly fechaMaxima = fechaMaximaNacimiento();

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

  get fechaNacimiento() {
    return this.registerForm.get('fechaNacimiento');
  }

  /** Mensaje del campo de fecha según el error que tenga. */
  get errorFecha(): string {
    const errores = this.fechaNacimiento?.errors ?? {};
    if (errores['required']) {
      return 'Escribe tu fecha de nacimiento.';
    }
    if (errores['menorDeEdad']) {
      return `FinanceUp es solo para mayores de ${EDAD_MINIMA} años.`;
    }
    return 'Revisa la fecha: debe ser día, mes y año reales.';
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmarPassword() {
    return this.registerForm.get('confirmarPassword');
  }

  /** Reglas de la contraseña con lo que ya cumple lo escrito. */
  get reglas(): Regla[] {
    return reglasContrasena(this.password?.value ?? '');
  }

  /** El campo muestra su error cuando ya se tocó y no es válido. */
  conError(campo: Campo): boolean {
    const control = this.registerForm.get(campo);
    return !!control && control.invalid && control.touched;
  }

  /** La confirmación falla si está vacía o no coincide con la contraseña. */
  confirmacionConError(): boolean {
    const control = this.confirmarPassword;
    return !!control?.touched && (control.invalid || !!this.registerForm.errors?.['passwordsNoCoinciden']);
  }

  /** Método para validar que las contraseñas sean iguales */
  passwordsIguales(form: AbstractControl): ValidationErrors | null {
    return form.get('password')?.value === form.get('confirmarPassword')?.value ? null : { passwordsNoCoinciden: true };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  registroUsuario(): void {
    this.errorMessage.set('');

    if (this.registerForm.invalid) {
      // Cada campo muestra su error y el foco va al primero que falla
      this.registerForm.markAllAsTouched();
      const primero = CAMPOS.find((campo) =>
        campo === 'confirmarPassword' ? this.confirmacionConError() : this.registerForm.get(campo)?.invalid,
      );
      document.getElementById(`reg-${primero}`)?.focus();
      return;
    }

    const { nombre, apellido, correo, fechaNacimiento, password } = this.registerForm.value;
    this.cargando.set(true);

    // El MID crea el usuario, su contraseña y su rol, y responde con la sesión iniciada
    this.authService
      .registrar({
        nombre,
        apellido,
        email: correo,
        contrasena: password,
        fecha_nacimiento: fechaNacimiento,
      })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.toastService.success(`Cuenta creada. ¡Bienvenido ${nombre}!`);
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.cargando.set(false);
          this.errorMessage.set(mensajeDeError(error));
        },
      });
  }
}
