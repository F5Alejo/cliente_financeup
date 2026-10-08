import { Injectable, signal } from '@angular/core';

export interface AccionPermiso {
  id: string;
  etiqueta: string;
}

export interface ModuloPermisos {
  id: string;
  nombre: string;
  acciones: AccionPermiso[];
}

export interface RolAdmin {
  id: string;
  nombre: string;
  descripcion: string;
  /** Identificadores con el formato "modulo.accion", por ejemplo "usuarios.ver". */
  permisos: string[];
  /** Los roles de sistema no se pueden eliminar. */
  sistema: boolean;
  /** El rol bloqueado conserva todos los permisos y no se puede editar (evita quedarse sin acceso). */
  bloqueado: boolean;
}

export interface ResultadoRol {
  exito: boolean;
  mensaje?: string;
  rol?: RolAdmin;
}

const accion = (id: string, etiqueta: string): AccionPermiso => ({ id, etiqueta });

export const MODULOS_PERMISOS: ModuloPermisos[] = [
  { id: 'usuarios', nombre: 'Usuarios', acciones: [accion('ver', 'Ver'), accion('crear', 'Crear'), accion('editar', 'Editar'), accion('eliminar', 'Eliminar'), accion('bloquear', 'Bloquear')] },
  { id: 'finanzas', nombre: 'Finanzas', acciones: [accion('ver', 'Ver'), accion('editar', 'Editar'), accion('administrar', 'Administrar')] },
  { id: 'cursos', nombre: 'Cursos', acciones: [accion('ver', 'Ver'), accion('crear', 'Crear'), accion('editar', 'Editar'), accion('eliminar', 'Eliminar')] },
  { id: 'pqr', nombre: 'PQR', acciones: [accion('ver', 'Ver'), accion('responder', 'Responder'), accion('cerrar', 'Cerrar')] },
  { id: 'alianzas', nombre: 'Alianzas', acciones: [accion('ver', 'Ver'), accion('crear', 'Crear'), accion('editar', 'Editar'), accion('aprobar', 'Aprobar')] },
  { id: 'reportes', nombre: 'Reportes', acciones: [accion('ver', 'Ver'), accion('exportar', 'Exportar')] },
];

export const TODOS_LOS_PERMISOS: string[] = MODULOS_PERMISOS.flatMap((m) => m.acciones.map((a) => `${m.id}.${a.id}`));

export const NOMBRE_ROL_MIN_CARACTERES = 3;

// TODO: BLOQUE TEMPORAL CON DATOS QUEMADOS (MOCK). Reemplazar por GET/POST/PUT/DELETE /roles del MID.
// La comprobación real de permisos debe hacerla el backend; aquí solo se administra la configuración.
const ROLES_MOCK: RolAdmin[] = [
  {
    id: 'admin',
    nombre: 'Administrador',
    descripcion: 'Acceso completo a todos los módulos del panel.',
    permisos: [...TODOS_LOS_PERMISOS],
    sistema: true,
    bloqueado: true,
  },
  {
    id: 'moderador',
    nombre: 'Moderador',
    descripcion: 'Atiende soporte y modera cuentas sin tocar la configuración financiera.',
    permisos: ['usuarios.ver', 'usuarios.bloquear', 'pqr.ver', 'pqr.responder', 'pqr.cerrar', 'cursos.ver', 'alianzas.ver', 'finanzas.ver', 'reportes.ver'],
    sistema: false,
    bloqueado: false,
  },
  {
    id: 'analista',
    nombre: 'Analista',
    descripcion: 'Consulta información y exporta reportes, sin modificar datos.',
    permisos: ['usuarios.ver', 'finanzas.ver', 'cursos.ver', 'alianzas.ver', 'reportes.ver', 'reportes.exportar'],
    sistema: false,
    bloqueado: false,
  },
  {
    id: 'user',
    nombre: 'Usuario',
    descripcion: 'Cliente de la plataforma. No tiene acceso al panel de administración.',
    permisos: [],
    sistema: true,
    bloqueado: false,
  },
];

@Injectable({ providedIn: 'root' })
export class RolesService {
  private siguienteId = 1;

  readonly roles = signal<RolAdmin[]>(ROLES_MOCK.map((r) => ({ ...r, permisos: [...r.permisos] })));

  obtener(id: string): RolAdmin | undefined {
    return this.roles().find((r) => r.id === id);
  }

  crear(nombre: string, descripcion: string, copiarDe?: string): ResultadoRol {
    const error = this.validarNombre(nombre);
    if (error) {
      return { exito: false, mensaje: error };
    }

    const base = copiarDe ? this.obtener(copiarDe) : undefined;
    const rol: RolAdmin = {
      id: `rol-${this.siguienteId++}`,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      permisos: base ? [...base.permisos] : [],
      sistema: false,
      bloqueado: false,
    };
    this.roles.update((lista) => [...lista, rol]);
    return { exito: true, rol };
  }

  editar(id: string, nombre: string, descripcion: string): ResultadoRol {
    const rol = this.obtener(id);
    if (!rol) return { exito: false, mensaje: 'El rol no existe.' };
    if (rol.bloqueado) return { exito: false, mensaje: 'El rol Administrador no se puede modificar.' };

    const error = this.validarNombre(nombre, id);
    if (error) return { exito: false, mensaje: error };

    this.reemplazar({ ...rol, nombre: nombre.trim(), descripcion: descripcion.trim() });
    return { exito: true };
  }

  guardarPermisos(id: string, permisos: string[]): ResultadoRol {
    const rol = this.obtener(id);
    if (!rol) return { exito: false, mensaje: 'El rol no existe.' };
    if (rol.bloqueado) return { exito: false, mensaje: 'El rol Administrador conserva todos los permisos.' };

    this.reemplazar({ ...rol, permisos: TODOS_LOS_PERMISOS.filter((p) => permisos.includes(p)) });
    return { exito: true };
  }

  duplicar(id: string): ResultadoRol {
    const rol = this.obtener(id);
    if (!rol) return { exito: false, mensaje: 'El rol no existe.' };

    let nombre = `${rol.nombre} (copia)`;
    for (let n = 2; this.nombreEnUso(nombre); n++) {
      nombre = `${rol.nombre} (copia ${n})`;
    }
    return this.crear(nombre, rol.descripcion, id);
  }

  eliminar(id: string, usuariosAsignados: number): ResultadoRol {
    const rol = this.obtener(id);
    if (!rol) return { exito: false, mensaje: 'El rol no existe.' };
    if (rol.sistema) return { exito: false, mensaje: 'Los roles de sistema no se pueden eliminar.' };
    if (usuariosAsignados > 0) {
      return { exito: false, mensaje: `El rol tiene ${usuariosAsignados} usuarios asignados. Reasígnalos antes de eliminarlo.` };
    }

    this.roles.update((lista) => lista.filter((r) => r.id !== id));
    return { exito: true };
  }

  private validarNombre(nombre: string, excluirId?: string): string | null {
    const limpio = nombre.trim();
    if (limpio.length < NOMBRE_ROL_MIN_CARACTERES) {
      return `El nombre debe tener mínimo ${NOMBRE_ROL_MIN_CARACTERES} caracteres.`;
    }
    return this.nombreEnUso(limpio, excluirId) ? 'Ya existe un rol con ese nombre.' : null;
  }

  private nombreEnUso(nombre: string, excluirId?: string): boolean {
    return this.roles().some((r) => r.id !== excluirId && r.nombre.toLowerCase() === nombre.trim().toLowerCase());
  }

  private reemplazar(rol: RolAdmin): void {
    this.roles.update((lista) => lista.map((r) => (r.id === rol.id ? rol : r)));
  }
}
