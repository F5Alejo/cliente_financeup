import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { mensajeDeError } from '../../../services/api';
import { ToastService } from '../../../shared/services/toast';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';
import { Regla, reglasContrasena } from '../reglas-contrasena';

// Pasos: 1) escribir el correo, 2) código + clave nueva, 3) listo
type Paso = 'correo' | 'codigo' | 'listo';

@Component({
  selector: 'app-recuperar-contrasena',
  imports: [FormsModule, RouterLink, BandaSeccionComponent, IconComponent],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: '../acceso.css',
})
export class RecuperarContrasena {
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
  mostrarClave = false;

  /** Al cambiar de paso el foco va a lo nuevo: el código en el paso 2, el título en el 3. */
  private campoCodigo = viewChild<ElementRef<HTMLInputElement>>('campoCodigo');
  private tituloListo = viewChild<ElementRef<HTMLElement>>('tituloListo');

  constructor() {
    effect(() => this.campoCodigo()?.nativeElement.focus());
    effect(() => this.tituloListo()?.nativeElement.focus());
  }

  /** Reglas de la contraseña con lo que ya cumple lo escrito (las mismas del MID). */
  get reglas(): Regla[] {
    return reglasContrasena(this.nuevaPassword);
  }

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

  guardarPassword(): void {
    this.errorMessage.set('');

    if (!/^\d{6}$/.test(this.codigo.trim())) {
      this.errorMessage.set('El código tiene 6 dígitos. Cópialo del correo que te enviamos.');
      return;
    }
    if (!this.reglas.every((regla) => regla.cumple)) {
      this.errorMessage.set('A la contraseña le falta cumplir alguna de las reglas de abajo.');
      return;
    }
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.errorMessage.set('La confirmación no coincide con la contraseña nueva.');
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
}
