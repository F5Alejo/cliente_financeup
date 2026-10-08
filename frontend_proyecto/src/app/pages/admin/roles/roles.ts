import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MODULOS_PERMISOS,
  NOMBRE_ROL_MIN_CARACTERES,
  RolAdmin,
  RolesService,
  TODOS_LOS_PERMISOS,
} from '../../../services/roles';
import { UsuariosService } from '../../../services/usuarios';
import { IconComponent } from '../../../shared/components/icon/icon';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { AccionMenu, RowMenuComponent } from '../../../shared/components/row-menu/row-menu';
import { ActividadAdminService } from '../../../shared/services/actividad-admin';
import { ToastService } from '../../../shared/services/toast';
import { enlazarConShell, simularCarga } from '../../../shared/utils/lista';

interface ModalRol {
  tipo: 'formulario' | 'eliminar';
  rol: RolAdmin | null;
}

@Component({
  selector: 'app-admin-roles',
  imports: [ReactiveFormsModule, IconComponent, ModalComponent, RowMenuComponent],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class AdminRolesComponent {
  private rolesService = inject(RolesService);
  private usuariosService = inject(UsuariosService);
  private toastService = inject(ToastService);
  private actividad = inject(ActividadAdminService);
  private fb = inject(FormBuilder).nonNullable;

  readonly modulos = MODULOS_PERMISOS;
  readonly totalPermisos = TODOS_LOS_PERMISOS.length;
  readonly esqueletos = [1, 2, 3, 4];

  cargando = simularCarga();
  roles = this.rolesService.roles;
  seleccionadoId = signal('admin');
  borrador = signal<string[]>([...TODOS_LOS_PERMISOS]);
  modal = signal<ModalRol | null>(null);
  errorModal = signal('');

  formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(NOMBRE_ROL_MIN_CARACTERES)]],
    descripcion: [''],
    copiarDe: [''],
  });

  private usuarios = computed(() => {
    this.usuariosService.cambios();
    return this.usuariosService.listar();
  });

  seleccionado = computed(() => this.roles().find((r) => r.id === this.seleccionadoId()) ?? this.roles()[0]);
  sucio = computed(() => {
    const original = this.seleccionado().permisos;
    const actual = this.borrador();
    return original.length !== actual.length || original.some((p) => !actual.includes(p));
  });

  constructor() {
    enlazarConShell(() => undefined, () => this.abrirFormulario());
  }

  filas = computed(() =>
    this.roles().map((rol) => ({
      rol,
      usuarios: this.usuariosDe(rol.id),
      acciones: this.accionesDe(rol),
    }))
  );

  usuariosDe(rolId: string): number {
    return this.usuarios().filter((u) => u.rol === rolId).length;
  }

  accionesDe(rol: RolAdmin): AccionMenu[] {
    return [
      { id: 'editar', etiqueta: 'Editar', icono: 'pencil', deshabilitado: rol.bloqueado },
      { id: 'duplicar', etiqueta: 'Duplicar', icono: 'copy' },
      { id: 'eliminar', etiqueta: 'Eliminar', icono: 'trash', peligro: true, separador: true, deshabilitado: rol.sistema },
    ];
  }

  seleccionar(rol: RolAdmin): void {
    if (rol.id === this.seleccionadoId()) return;
    if (this.sucio()) {
      this.toastService.info('Se descartaron los cambios sin guardar.');
    }
    this.seleccionadoId.set(rol.id);
    this.borrador.set([...rol.permisos]);
  }

  tiene(permiso: string): boolean {
    return this.borrador().includes(permiso);
  }

  alternar(permiso: string): void {
    this.borrador.update((lista) => (lista.includes(permiso) ? lista.filter((p) => p !== permiso) : [...lista, permiso]));
  }

  permisosDeModulo(moduloId: string): string[] {
    return this.modulos.find((m) => m.id === moduloId)?.acciones.map((a) => `${moduloId}.${a.id}`) ?? [];
  }

  moduloCompleto(moduloId: string): boolean {
    return this.permisosDeModulo(moduloId).every((p) => this.tiene(p));
  }

  alternarModulo(moduloId: string): void {
    const permisos = this.permisosDeModulo(moduloId);
    const completo = this.moduloCompleto(moduloId);
    this.borrador.update((lista) => {
      const resto = lista.filter((p) => !permisos.includes(p));
      return completo ? resto : [...resto, ...permisos];
    });
  }

  descartar(): void {
    this.borrador.set([...this.seleccionado().permisos]);
  }

  guardarPermisos(): void {
    const rol = this.seleccionado();
    const resultado = this.rolesService.guardarPermisos(rol.id, this.borrador());
    if (!resultado.exito) {
      this.toastService.error(resultado.mensaje ?? 'No se pudieron guardar los permisos.');
      return;
    }
    this.actividad.registrar('Roles', 'Modificó permisos', `Rol ${rol.nombre}: ${this.borrador().length} de ${this.totalPermisos} permisos.`);
    this.toastService.success(`Permisos del rol ${rol.nombre} actualizados.`);
  }

  alElegirAccion(id: string, rol: RolAdmin): void {
    if (id === 'editar') this.abrirFormulario(rol);
    if (id === 'duplicar') this.duplicar(rol);
    if (id === 'eliminar') {
      this.errorModal.set('');
      this.modal.set({ tipo: 'eliminar', rol });
    }
  }

  abrirFormulario(rol: RolAdmin | null = null): void {
    this.errorModal.set('');
    this.formulario.reset({ nombre: rol?.nombre ?? '', descripcion: rol?.descripcion ?? '', copiarDe: '' });
    this.modal.set({ tipo: 'formulario', rol });
  }

  cerrarModal(): void {
    this.modal.set(null);
  }

  guardarFormulario(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.errorModal.set(`El nombre debe tener mínimo ${NOMBRE_ROL_MIN_CARACTERES} caracteres.`);
      return;
    }

    const { nombre, descripcion, copiarDe } = this.formulario.getRawValue();
    const edicion = this.modal()?.rol;
    const resultado = edicion
      ? this.rolesService.editar(edicion.id, nombre, descripcion)
      : this.rolesService.crear(nombre, descripcion, copiarDe || undefined);

    if (!resultado.exito) {
      this.errorModal.set(resultado.mensaje ?? 'No se pudo guardar el rol.');
      return;
    }

    this.actividad.registrar('Roles', edicion ? 'Editó un rol' : 'Creó un rol', nombre.trim());
    this.toastService.success(edicion ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.');
    if (resultado.rol) this.seleccionar(resultado.rol);
    this.cerrarModal();
  }

  duplicar(rol: RolAdmin): void {
    const resultado = this.rolesService.duplicar(rol.id);
    if (!resultado.exito || !resultado.rol) {
      this.toastService.error(resultado.mensaje ?? 'No se pudo duplicar el rol.');
      return;
    }
    this.actividad.registrar('Roles', 'Duplicó un rol', `${rol.nombre} → ${resultado.rol.nombre}`);
    this.toastService.success(`Rol duplicado como «${resultado.rol.nombre}».`);
    this.seleccionar(resultado.rol);
  }

  confirmarEliminacion(): void {
    const rol = this.modal()?.rol;
    if (!rol) return;

    const resultado = this.rolesService.eliminar(rol.id, this.usuariosDe(rol.id));
    if (!resultado.exito) {
      this.errorModal.set(resultado.mensaje ?? 'No se pudo eliminar el rol.');
      return;
    }

    this.actividad.registrar('Roles', 'Eliminó un rol', rol.nombre);
    this.toastService.success(`Rol «${rol.nombre}» eliminado.`);
    if (this.seleccionadoId() === rol.id) {
      this.seleccionar(this.roles()[0]);
    }
    this.cerrarModal();
  }
}
