import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast';

type StageId = 's1' | 's2' | 's3';
type RecoveryMethod = 'email' | 'sms';

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
  private toastService = inject(ToastService);

  // ---------- Estado del flujo ----------

  currentStage: StageId = 's1';
  selectedMethod: RecoveryMethod = 'email';

  newPassword = '';
  confirmPassword = '';

  rules: PasswordRules = {
    minLength: false,
    hasNumber: false,
    hasUppercase: false,
  };

  // ---------- Navegación entre etapas ----------

  goTo(stage: StageId): void {
    this.currentStage = stage;
  }

  // ---------- Selección de método de recuperación ----------

  selectMethod(method: RecoveryMethod): void {
    this.selectedMethod = method;
  }

  sendCode(): void {
    // Aquí iría la llamada real al servicio de autenticación para
    // enviar el código según this.selectedMethod ('email' | 'sms').
    console.log(`Enviando código de verificación por: ${this.selectedMethod}`);
    this.goTo('s2');
  }

  // ---------- Validación de nueva contraseña ----------

  onPasswordInput(): void {
    this.rules = this.evaluatePassword(this.newPassword);
  }

  private evaluatePassword(value: string): PasswordRules {
    return {
      minLength: value.length >= 8,
      hasNumber: /\d/.test(value),
      hasUppercase: /[A-Z]/.test(value),
    };
  }

  get allRulesPassed(): boolean {
    return this.rules.minLength && this.rules.hasNumber && this.rules.hasUppercase;
  }

  savePassword(): void {
    if (!this.allRulesPassed) {
      this.toastService.error('La contraseña no cumple con todos los requisitos.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toastService.error('Las contraseñas no coinciden.');
      return;
    }

    // Aquí iría la llamada real al servicio para guardar la nueva contraseña.
    this.toastService.success('Contraseña actualizada correctamente.');
    this.goTo('s3');
  }

  // ---------- Navegación de salida ----------

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}