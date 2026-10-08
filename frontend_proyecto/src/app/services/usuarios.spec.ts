import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth';
import { UsuariosService } from './usuarios';

const ADMIN = 'admin@gmail.com';
const OBJETIVO = 'usuario@gmail.com';
const MOTIVO = 'Actividad sospechosa';

describe('UsuariosService', () => {
  let service: UsuariosService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsuariosService);
  });

  const estadoDe = (email: string) => service.listar().find((u) => u.email === email)?.estado;

  it('lista nombre, correo, rol y estado sin exponer la contraseña', () => {
    const lista = service.listar();

    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every((u) => !('password' in u))).toBe(true);
    expect(new Set(lista.map((u) => u.estado))).toEqual(new Set(['activo', 'bloqueado', 'pendiente', 'suspendido']));
    expect(lista.every((u) => 'fechaRegistro' in u && 'ultimoAcceso' in u)).toBe(true);
  });

  it('bloquea una cuenta y deja registro en la bitácora', () => {
    const resultado = service.bloquear(OBJETIVO, MOTIVO, ADMIN);

    expect(resultado.exito).toBe(true);
    expect(estadoDe(OBJETIVO)).toBe('bloqueado');
    expect(service.bitacora()).toEqual([
      expect.objectContaining({ email: OBJETIVO, accion: 'bloqueo', motivo: MOTIVO, admin: ADMIN }),
    ]);
  });

  it('rechaza el bloqueo sin motivo', () => {
    const resultado = service.bloquear(OBJETIVO, '   ', ADMIN);

    expect(resultado.exito).toBe(false);
    expect(estadoDe(OBJETIVO)).toBe('activo');
    expect(service.bitacora()).toHaveLength(0);
  });

  it('rechaza a quien no es administrador (equivale al 403)', () => {
    const resultado = service.bloquear('test@gmail.com', MOTIVO, OBJETIVO);

    expect(resultado.exito).toBe(false);
    expect(estadoDe('test@gmail.com')).toBe('activo');
  });

  it('no permite que un administrador se bloquee ni se cambie el rol a sí mismo', () => {
    expect(service.bloquear(ADMIN, MOTIVO, ADMIN).exito).toBe(false);
    expect(service.cambiarRol(ADMIN, 'user', ADMIN).exito).toBe(false);
    expect(estadoDe(ADMIN)).toBe('activo');
  });

  it('desbloquea una cuenta bloqueada y lo registra', () => {
    service.bloquear(OBJETIVO, MOTIVO, ADMIN);

    const resultado = service.desbloquear(OBJETIVO, ADMIN);

    expect(resultado.exito).toBe(true);
    expect(estadoDe(OBJETIVO)).toBe('activo');
    expect(service.bitacora().map((r) => r.accion)).toEqual(['bloqueo', 'desbloqueo']);
  });

  it('cambia el rol de otro usuario', () => {
    const resultado = service.cambiarRol(OBJETIVO, 'admin', ADMIN);

    expect(resultado.exito).toBe(true);
    expect(service.listar().find((u) => u.email === OBJETIVO)?.rol).toBe('admin');
  });

  describe('crear', () => {
    const nuevo = {
      nombre: 'Marta',
      apellido: 'Pérez',
      email: 'marta@gmail.com',
      password: 'Segura123',
      rol: 'user' as const,
      telefono: ' 3001234567 ',
    };

    it('crea un usuario activo que puede iniciar sesión', () => {
      const resultado = service.crear(nuevo, ADMIN);

      expect(resultado.exito).toBe(true);
      const creado = service.listar().find((u) => u.email === nuevo.email);
      expect(creado).toMatchObject({ nombre: 'Marta', rol: 'user', estado: 'activo', telefono: '3001234567' });
      expect(creado && 'password' in creado).toBe(false);
      expect(TestBed.inject(AuthService).validarCredenciales(nuevo.email, nuevo.password)).not.toBeNull();
    });

    it('rechaza un correo repetido (equivale al 409)', () => {
      const resultado = service.crear({ ...nuevo, email: 'USUARIO@gmail.com' }, ADMIN);

      expect(resultado.exito).toBe(false);
      expect(service.listar().filter((u) => u.email.toLowerCase() === OBJETIVO)).toHaveLength(1);
    });

    it('rechaza datos inválidos', () => {
      expect(service.crear({ ...nuevo, email: 'no-es-correo' }, ADMIN).exito).toBe(false);
      expect(service.crear({ ...nuevo, password: 'debil' }, ADMIN).exito).toBe(false);
      expect(service.crear({ ...nuevo, nombre: 'Ma' }, ADMIN).exito).toBe(false);
      expect(service.crear({ ...nuevo, rol: 'root' as never }, ADMIN).exito).toBe(false);
      expect(service.listar().some((u) => u.email === nuevo.email)).toBe(false);
    });

    it('rechaza a quien no es administrador', () => {
      expect(service.crear(nuevo, OBJETIVO).exito).toBe(false);
    });
  });

  describe('editar', () => {
    it('actualiza nombre y datos de contacto sin tocar el correo ni el rol', () => {
      const resultado = service.editar(OBJETIVO, { nombre: 'Nuevo', apellido: 'Nombre', telefono: '3110000000', documento: '' }, ADMIN);

      expect(resultado.exito).toBe(true);
      expect(service.listar().find((u) => u.email === OBJETIVO)).toMatchObject({
        nombre: 'Nuevo',
        apellido: 'Nombre',
        telefono: '3110000000',
        rol: 'user',
      });
    });

    it('no permite editar la propia cuenta ni dejar el nombre vacío', () => {
      expect(service.editar(ADMIN, { nombre: 'Otro', apellido: 'Nombre' }, ADMIN).exito).toBe(false);
      expect(service.editar(OBJETIVO, { nombre: '', apellido: 'Nombre' }, ADMIN).exito).toBe(false);
    });
  });

  describe('eliminar', () => {
    it('elimina la cuenta y deja registro en la bitácora', () => {
      const resultado = service.eliminar(OBJETIVO, ADMIN);

      expect(resultado.exito).toBe(true);
      expect(service.listar().some((u) => u.email === OBJETIVO)).toBe(false);
      expect(service.bitacora().map((r) => r.accion)).toEqual(['eliminacion']);
    });

    it('no permite eliminarse a sí mismo ni actuar sin ser administrador', () => {
      expect(service.eliminar(ADMIN, ADMIN).exito).toBe(false);
      expect(service.eliminar('test@gmail.com', OBJETIVO).exito).toBe(false);
      expect(service.listar().some((u) => u.email === ADMIN)).toBe(true);
    });
  });

  describe('nuevas acciones del panel', () => {
    it('reactiva una cuenta suspendida', () => {
      expect(service.desbloquear('mateo@gmail.com', ADMIN).exito).toBe(true);
      expect(estadoDe('mateo@gmail.com')).toBe('activo');
    });

    it('no reactiva una cuenta que ya está activa ni una pendiente', () => {
      expect(service.desbloquear(OBJETIVO, ADMIN).exito).toBe(false);
      expect(service.desbloquear('sofia@gmail.com', ADMIN).exito).toBe(false);
    });

    it('permite bloquear una cuenta pendiente o suspendida', () => {
      expect(service.bloquear('sofia@gmail.com', MOTIVO, ADMIN).exito).toBe(true);
      expect(service.bloquear('mateo@gmail.com', MOTIVO, ADMIN).exito).toBe(true);
      expect(estadoDe('sofia@gmail.com')).toBe('bloqueado');
      expect(estadoDe('mateo@gmail.com')).toBe('bloqueado');
    });

    it('registra el cambio de rol y no registra nada si el rol no cambia', () => {
      service.cambiarRol(OBJETIVO, 'user', ADMIN);
      expect(service.bitacora()).toHaveLength(0);

      service.cambiarRol(OBJETIVO, 'admin', ADMIN);
      expect(service.actividadDe(OBJETIVO).map((r) => r.accion)).toEqual(['cambio-rol']);
    });

    it('restablece la contraseña solo si quien lo pide es administrador y no es su propia cuenta', () => {
      expect(service.restablecerPassword(OBJETIVO, ADMIN).exito).toBe(true);
      expect(service.restablecerPassword(ADMIN, ADMIN).exito).toBe(false);
      expect(service.restablecerPassword('test@gmail.com', OBJETIVO).exito).toBe(false);
      expect(service.actividadDe(OBJETIVO).map((r) => r.accion)).toEqual(['restablecimiento']);
    });

    it('la actividad de una cuenta solo incluye acciones sobre esa cuenta', () => {
      service.bloquear(OBJETIVO, MOTIVO, ADMIN);
      service.bloquear('test@gmail.com', MOTIVO, ADMIN);

      expect(service.actividadDe(OBJETIVO)).toHaveLength(1);
      expect(service.actividadDe(OBJETIVO)[0].email).toBe(OBJETIVO);
    });

    it('incrementa el contador de cambios con cada modificación', () => {
      const antes = service.cambios();
      service.bloquear(OBJETIVO, MOTIVO, ADMIN);
      expect(service.cambios()).toBeGreaterThan(antes);
    });

    it('las cuentas pendientes y suspendidas tampoco pueden iniciar sesión', () => {
      const auth = TestBed.inject(AuthService);

      expect(auth.iniciarSesion('sofia@gmail.com', '123456')).toBe(false);
      expect(auth.iniciarSesion('mateo@gmail.com', '123456')).toBe(false);
      expect(auth.estaAutenticado()).toBe(false);
    });

    it('registra el último acceso al iniciar sesión', () => {
      const auth = TestBed.inject(AuthService);
      const antes = service.obtener('julian@gmail.com')?.ultimoAcceso;
      expect(antes).toBeNull();

      const usuario = service.buscar('usuario@gmail.com')!;
      auth.completarSesion(usuario);

      expect(service.obtener('usuario@gmail.com')?.ultimoAcceso).toBe(usuario.ultimoAcceso);
      expect(Date.now() - new Date(usuario.ultimoAcceso!).getTime()).toBeLessThan(5000);
    });
  });

  it('un usuario bloqueado no puede iniciar sesión', () => {
    const auth = TestBed.inject(AuthService);
    service.bloquear(OBJETIVO, MOTIVO, ADMIN);

    expect(auth.validarCredenciales(OBJETIVO, '123456')?.estado).toBe('bloqueado');
    expect(auth.iniciarSesion(OBJETIVO, '123456')).toBe(false);
    expect(auth.estaAutenticado()).toBe(false);
  });
});
