import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, Usuario } from '../../services/auth';
import { ToastService } from '../../shared/services/toast';

interface PasswordRules {
  minLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  usuario: Usuario | null = null;

  // ---------- Datos personales ----------
  nombre = '';
  apellido = '';
  telefono = '';
  documento = '';
  direccion = '';
  fechaNacimiento = '';

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
    this.usuario = this.authService.obtenerUsuario();
    if (this.usuario) {
      this.nombre = this.usuario.nombre;
      this.apellido = this.usuario.apellido ?? '';
      this.telefono = this.usuario.telefono ?? '';
      this.documento = this.usuario.documento ?? '';
      this.direccion = this.usuario.direccion ?? '';
      this.fechaNacimiento = this.usuario.fechaNacimiento ?? '';
    }
  }

  guardarPerfil(): void {
    if (!this.nombre.trim() || !this.apellido.trim()) {
      this.toastService.error('Nombre y apellido son obligatorios.');
      return;
    }

    const resultado = this.authService.actualizarPerfil({
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      telefono: this.telefono.trim(),
      documento: this.documento.trim(),
      direccion: this.direccion.trim(),
      fechaNacimiento: this.fechaNacimiento,
    });

    if (resultado.exito) {
      this.usuario = this.authService.obtenerUsuario();
      this.toastService.success('Datos personales actualizados correctamente.');
    } else {
      this.toastService.error('No se pudo actualizar el perfil.');
    }
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
    if (!this.todasLasReglasCumplidas) {
      this.toastService.error('La nueva contraseña no cumple con todos los requisitos.');
      return;
    }

    if (this.passwordNueva !== this.passwordConfirmar) {
      this.toastService.error('Las contraseñas no coinciden.');
      return;
    }

    const resultado = this.authService.cambiarPassword(this.passwordActual, this.passwordNueva);

    if (resultado.exito) {
      this.toastService.success('Contraseña actualizada correctamente.');
      this.passwordActual = '';
      this.passwordNueva = '';
      this.passwordConfirmar = '';
      this.rules = { minLength: false, hasNumber: false, hasUppercase: false };
    } else {
      this.toastService.error(resultado.mensaje ?? 'No se pudo cambiar la contraseña.');
    }
  }
}
