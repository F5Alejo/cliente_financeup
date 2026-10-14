import { TestBed } from '@angular/core/testing';

import { RolesService, TODOS_LOS_PERMISOS } from './roles';

describe('RolesService', () => {
  let service: RolesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RolesService);
  });

  it('el rol Administrador tiene todos los permisos y no se puede modificar', () => {
    const admin = service.obtener('admin')!;

    expect(admin.permisos).toHaveLength(TODOS_LOS_PERMISOS.length);
    expect(service.guardarPermisos('admin', []).exito).toBe(false);
    expect(service.editar('admin', 'Otro nombre', '').exito).toBe(false);
    expect(service.obtener('admin')!.permisos).toHaveLength(TODOS_LOS_PERMISOS.length);
  });

  it('crea un rol vacío o copiando los permisos de otro', () => {
    const vacio = service.crear('Supervisor', 'Supervisa al equipo');
    const copia = service.crear('Auditor', '', 'analista');

    expect(vacio.rol?.permisos).toEqual([]);
    expect(copia.rol?.permisos).toEqual(service.obtener('analista')!.permisos);
    expect(vacio.rol?.sistema).toBe(false);
  });

  it('rechaza nombres cortos o repetidos', () => {
    expect(service.crear('ab', '').exito).toBe(false);
    expect(service.crear('  moderador ', '').exito).toBe(false);
    expect(service.roles().filter((r) => r.nombre.toLowerCase() === 'moderador')).toHaveLength(1);
  });

  it('guarda permisos ignorando identificadores desconocidos y sin duplicados', () => {
    service.guardarPermisos('moderador', ['usuarios.ver', 'usuarios.ver', 'inventado.borrar', 'pqr.cerrar']);

    expect(service.obtener('moderador')!.permisos).toEqual(['usuarios.ver', 'pqr.cerrar']);
  });

  it('duplica un rol con un nombre nuevo y sus mismos permisos', () => {
    const primera = service.duplicar('moderador');
    const segunda = service.duplicar('moderador');

    expect(primera.rol?.nombre).toBe('Moderador (copia)');
    expect(segunda.rol?.nombre).toBe('Moderador (copia 2)');
    expect(primera.rol?.permisos).toEqual(service.obtener('moderador')!.permisos);
  });

  it('no elimina roles de sistema ni roles con usuarios asignados', () => {
    expect(service.eliminar('admin', 0).exito).toBe(false);
    expect(service.eliminar('user', 0).exito).toBe(false);
    expect(service.eliminar('moderador', 2).exito).toBe(false);
    expect(service.obtener('moderador')).toBeDefined();
  });

  it('elimina un rol sin usuarios', () => {
    expect(service.eliminar('analista', 0).exito).toBe(true);
    expect(service.obtener('analista')).toBeUndefined();
  });
});
