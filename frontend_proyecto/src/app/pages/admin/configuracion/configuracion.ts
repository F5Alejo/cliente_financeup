import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { ETIQUETA_CATEGORIA } from '../../../services/notificaciones';
import { CategoriaNotificacion, PreferenciasAdminService } from '../../../services/preferencias-admin';
import { RolesService, TODOS_LOS_PERMISOS } from '../../../services/roles';
import { SesionesAdminService } from '../../../services/sesiones-admin';
import { PASSWORD_PATRON, UsuariosService } from '../../../services/usuarios';
import { IconComponent, NombreIcono } from '../../../shared/components/icon/icon';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { ActividadAdminService } from '../../../shared/services/actividad-admin';
import { ToastService } from '../../../shared/services/toast';
import { formatearFechaHora, tiempoRelativo } from '../../../shared/utils/fechas';

type Seccion = 'perfil' | 'seguridad' | 'notificaciones' | 'roles' | 'sistema' | 'privacidad' | 'sesiones';

const DESCRIPCION_CATEGORIA: Record<CategoriaNotificacion, string> = {
  seguridad: 'Intentos de acceso fallidos y accesos desde dispositivos nuevos.',
  usuarios: 'Cuando se registra una cuenta nueva en la plataforma.',
  pqr: 'Cuando llega una PQR o hay una con prioridad alta sin responder.',
  alianzas: 'Cuando un usuario envía una solicitud a un aliado.',
  actividad: 'Cambios importantes hechos por otros administradores.',
};

function coincideConfirmacion(grupo: AbstractControl): ValidationErrors | null {
  return grupo.get('nueva')?.value === grupo.get('confirmar')?.value ? null : { noCoincide: true };
}

@Component({
  selector: 'app-admin-configuracion',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, ModalComponent],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class AdminConfiguracionComponent {
  private authService = inject(AuthService);
  private preferencias = inject(PreferenciasAdminService);
  private sesionesService = inject(SesionesAdminService);
  private rolesService = inject(RolesService);
  private usuariosService = inject(UsuariosService);
  private actividad = inject(ActividadAdminService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder).nonNullable;

  readonly secciones: { valor: Seccion; etiqueta: string; icono: NombreIcono }[] = [
    { valor: 'perfil', etiqueta: 'Perfil', icono: 'user' },
    { valor: 'seguridad', etiqueta: 'Seguridad', icono: 'lock' },
    { valor: 'notificaciones', etiqueta: 'Notificaciones', icono: 'bell' },
    { valor: 'roles', etiqueta: 'Roles y permisos', icono: 'shield-check' },
    { valor: 'sistema', etiqueta: 'Configuración del sistema', icono: 'settings' },
    { valor: 'privacidad', etiqueta: 'Privacidad', icono: 'eye' },
    { valor: 'sesiones', etiqueta: 'Sesiones activas', icono: 'clock' },
  ];
  readonly categorias = Object.entries(ETIQUETA_CATEGORIA) as [CategoriaNotificacion, string][];
  readonly descripcionCategoria = DESCRIPCION_CATEGORIA;
  readonly accesos = this.sesionesService.accesos;
  readonly totalPermisos = TODOS_LOS_PERMISOS.length;
  readonly retenciones = [90, 180, 365, 730];
  readonly expiraciones = [15, 30, 60, 120];

  seccion = signal<Seccion>('perfil');
  prefs = this.preferencias.prefs;
  sesiones = this.sesionesService.sesiones;
  modal = signal<'dosFactores' | 'cerrarTodas' | null>(null);
  errorPassword = signal('');

  usuario = signal(this.authService.obtenerUsuario());
  nombreCompleto = computed(() => {
    const u = this.usuario();
    return u ? `${u.nombre} ${u.apellido ?? ''}`.trim() : 'Administrador';
  });
  iniciales = computed(() => this.nombreCompleto().split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join(''));
  roles = this.rolesService.roles;
  usuariosPorRol = computed(() => {
    this.usuariosService.cambios();
    const usuarios = this.usuariosService.listar();
    return (id: string) => usuarios.filter((u) => u.rol === id).length;
  });

  perfilForm = this.fb.group({
    nombre: [this.usuario()?.nombre ?? '', [Validators.required, Validators.minLength(3)]],
    apellido: [this.usuario()?.apellido ?? ''],
    email: [{ value: this.usuario()?.email ?? '', disabled: true }],
    telefono: [this.usuario()?.telefono ?? ''],
    documento: [this.usuario()?.documento ?? ''],
    direccion: [this.usuario()?.direccion ?? ''],
  });

  passwordForm = this.fb.group(
    {
      actual: ['', Validators.required],
      nueva: ['', [Validators.required, Validators.pattern(PASSWORD_PATRON)]],
      confirmar: ['', Validators.required],
    },
    { validators: coincideConfirmacion }
  );

  sistemaForm = this.fb.group({
    moneda: [this.prefs().sistema.moneda],
    zonaHoraria: [this.prefs().sistema.zonaHoraria],
    idioma: [this.prefs().sistema.idioma],
    sesionExpiraMin: [this.prefs().sesionExpiraMin],
    mantenimiento: [this.prefs().sistema.mantenimiento],
  });

  ultimaActividad(fecha: string): string {
    return tiempoRelativo(fecha);
  }

  fechaHora(fecha: string): string {
    return formatearFechaHora(fecha);
  }

  errorPasswordCampo(campo: 'actual' | 'nueva' | 'confirmar'): string {
    const control = this.passwordForm.controls[campo];
    if (!control.touched) return '';
    if (campo === 'nueva' && control.invalid) return 'Mínimo 8 caracteres, con mayúscula, minúscula y número.';
    if (campo === 'actual' && control.invalid) return 'Escribe tu contraseña actual.';
    if (campo === 'confirmar' && (control.invalid || this.passwordForm.hasError('noCoincide'))) return 'Las contraseñas no coinciden.';
    return '';
  }

  guardarPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }
    const v = this.perfilForm.getRawValue();
    const resultado = this.authService.actualizarPerfil({
      nombre: v.nombre.trim(),
      apellido: v.apellido.trim(),
      telefono: v.telefono.trim(),
      documento: v.documento.trim(),
      direccion: v.direccion.trim(),
    });
    if (!resultado.exito) {
      this.toastService.error('No se pudo actualizar el perfil.');
      return;
    }
    this.usuario.set(this.authService.obtenerUsuario());
    this.perfilForm.markAsPristine();
    this.actividad.registrar('Configuración', 'Actualizó su perfil');
    this.toastService.success('Perfil actualizado correctamente.');
  }

  cambiarPassword(): void {
    this.errorPassword.set('');
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { actual, nueva } = this.passwordForm.getRawValue();
    if (actual === nueva) {
      this.errorPassword.set('La nueva contraseña debe ser distinta de la actual.');
      return;
    }
    const resultado = this.authService.cambiarPassword(actual, nueva);
    if (!resultado.exito) {
      this.errorPassword.set(resultado.mensaje ?? 'No se pudo cambiar la contraseña.');
      return;
    }
    this.passwordForm.reset();
    this.actividad.registrar('Seguridad', 'Cambió su contraseña');
    this.toastService.success('Contraseña actualizada correctamente.');
  }

  alternarDosFactores(evento: Event): void {
    const activar = (evento.target as HTMLInputElement).checked;
    if (activar) {
      this.preferencias.actualizar({ dosFactores: true });
      this.actividad.registrar('Configuración', 'Activó la verificación en dos pasos');
      this.toastService.success('Verificación en dos pasos activada.');
      return;
    }
    // Se vuelve a marcar hasta que confirme en el modal.
    (evento.target as HTMLInputElement).checked = true;
    this.modal.set('dosFactores');
  }

  confirmarDesactivarDosFactores(): void {
    this.preferencias.actualizar({ dosFactores: false });
    this.actividad.registrar('Configuración', 'Desactivó la verificación en dos pasos');
    this.toastService.info('Verificación en dos pasos desactivada.');
    this.modal.set(null);
  }

  alternarNotificacion(categoria: CategoriaNotificacion, evento: Event): void {
    const activa = (evento.target as HTMLInputElement).checked;
    this.preferencias.actualizar({ notificaciones: { ...this.prefs().notificaciones, [categoria]: activa } });
    this.toastService.success(`${ETIQUETA_CATEGORIA[categoria]}: ${activa ? 'activadas' : 'desactivadas'}.`);
  }

  guardarSistema(): void {
    const v = this.sistemaForm.getRawValue();
    this.preferencias.actualizar({
      sesionExpiraMin: Number(v.sesionExpiraMin),
      sistema: { moneda: v.moneda, zonaHoraria: v.zonaHoraria, idioma: v.idioma, mantenimiento: v.mantenimiento },
    });
    this.sistemaForm.markAsPristine();
    this.actividad.registrar('Configuración', 'Modificó la configuración del sistema', v.mantenimiento ? 'Modo mantenimiento activado.' : undefined);
    this.toastService.success('Configuración del sistema guardada.');
  }

  alternarPrivacidad(campo: 'datosDeUso' | 'mostrarUltimoAcceso', evento: Event): void {
    const valor = (evento.target as HTMLInputElement).checked;
    this.preferencias.actualizar({ privacidad: { ...this.prefs().privacidad, [campo]: valor } });
    this.toastService.success('Preferencia de privacidad guardada.');
  }

  cambiarRetencion(evento: Event): void {
    const dias = Number((evento.target as HTMLSelectElement).value);
    this.preferencias.actualizar({ privacidad: { ...this.prefs().privacidad, retencionAuditoriaDias: dias } });
    this.toastService.success('Retención de la auditoría actualizada.');
  }

  descargarMisDatos(): void {
    const u = this.usuario();
    const datos = {
      perfil: u ? { nombre: u.nombre, apellido: u.apellido, email: u.email, telefono: u.telefono, documento: u.documento, direccion: u.direccion, rol: u.rol } : null,
      preferencias: this.prefs(),
      generadoEl: new Date().toISOString(),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'mis-datos-financeup.json';
    enlace.click();
    URL.revokeObjectURL(url);
    this.actividad.registrar('Configuración', 'Descargó sus datos personales');
    this.toastService.success('Descarga iniciada.');
  }

  cerrarSesion(id: string): void {
    this.sesionesService.cerrar(id);
    this.actividad.registrar('Seguridad', 'Cerró una sesión activa');
    this.toastService.success('Sesión cerrada.');
  }

  cerrarOtras(): void {
    const cerradas = this.sesionesService.cerrarOtras();
    if (cerradas === 0) {
      this.toastService.info('No hay otras sesiones abiertas.');
      return;
    }
    this.actividad.registrar('Seguridad', 'Cerró las demás sesiones', `${cerradas} sesiones.`);
    this.toastService.success(`Se cerraron ${cerradas} sesiones.`);
  }

  confirmarCerrarTodas(): void {
    this.actividad.registrar('Seguridad', 'Cerró todas las sesiones');
    this.sesionesService.cerrarOtras();
    this.modal.set(null);
    this.authService.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
