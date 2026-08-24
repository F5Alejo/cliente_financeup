import { Injectable } from '@angular/core';

export interface Usuario {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  rol: string;
}

// TODO: BLOQUE TEMPORAL CON DATOS QUEMADOS (MOCK)
// Reemplazar por llamadas HTTP al backend real cuando esté listo (HttpClient + endpoints de auth).
const USUARIOS_MOCK: Usuario[] = [
  { email: 'admin@financeup.com', password: 'admin123', nombre: 'Administrador', rol: 'admin' },
  { email: 'usuario@financeup.com', password: 'usuario123', nombre: 'Usuario Demo', rol: 'user' },
  { email: 'test@financeup.com', password: '123456', nombre: 'Test User', rol: 'user' }
];

const STORAGE_KEY = 'financeup_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioActual: Usuario | null = null;

  // Lista en memoria: incluye los mock originales + los que se registren en esta sesión.
  // TODO: al conectar el backend real, este arreglo desaparece; registrarUsuario() pasa a ser un POST /api/auth/register.
  private usuarios: Usuario[] = [...USUARIOS_MOCK];

  constructor() {
    // Recupera la sesión si ya había un usuario logueado (persistencia entre recargas)
    const guardado = sessionStorage.getItem(STORAGE_KEY);
    if (guardado) {
      this.usuarioActual = JSON.parse(guardado);
    }
  }

  /**
   * Valida credenciales contra los usuarios quemados (mock).
   * Devuelve true si el login fue exitoso, false si las credenciales son incorrectas.
   */
  iniciarSesion(email: string, password: string): boolean {
    const usuario = this.usuarios.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!usuario) {
      return false;
    }

    this.usuarioActual = usuario;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    return true;
  }

  /**
   * Login con proveedor social (Google/Apple/Facebook).
   * MOCK: simula la respuesta del proveedor mientras no haya SDK/backend real conectado.
   * TODO: reemplazar por el flujo real de cada proveedor (ver notas de integración).
   */
  iniciarSesionConProveedor(proveedor: 'google' | 'apple' | 'facebook'): Promise<Usuario> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const emailSimulado = `usuario@${proveedor}.com`;

        let usuario = this.usuarios.find(
          (u) => u.email.toLowerCase() === emailSimulado.toLowerCase()
        );

        // Si es la primera vez que "entra" con ese proveedor, se crea el usuario
        if (!usuario) {
          usuario = {
            email: emailSimulado,
            password: '', // no aplica en login social
            nombre: `Usuario ${proveedor.charAt(0).toUpperCase() + proveedor.slice(1)}`,
            rol: 'user'
          };
          this.usuarios.push(usuario);
        }

        this.usuarioActual = usuario;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
        resolve(usuario);
      }, 1200);
    });
  }

  /**
   * Registra un nuevo usuario (mock, en memoria) y lo deja autenticado.
   * Devuelve { exito: true } si se creó, o { exito: false, mensaje } si el correo ya existe.
   */
  registrarUsuario(nombre: string, apellido: string, email: string, password: string): { exito: boolean; mensaje?: string } {
    const yaExiste = this.usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase());

    if (yaExiste) {
      return { exito: false, mensaje: 'Ya existe una cuenta registrada con ese correo.' };
    }

    const nuevoUsuario: Usuario = {
      email,
      password,
      nombre,
      apellido,
      rol: 'user'
    };

    this.usuarios.push(nuevoUsuario);
    this.usuarioActual = nuevoUsuario;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nuevoUsuario));

    return { exito: true };
  }

  /**
   * Devuelve el usuario autenticado actualmente, o null si no hay sesión activa.
   */
  obtenerUsuario(): Usuario | null {
    return this.usuarioActual;
  }

  /**
   * Devuelve el nombre del usuario autenticado.
   */
  obtenerNombre(): string {
    return this.usuarioActual?.nombre || 'Invitado';
  }

  /**
   * Indica si hay una sesión activa.
   */
  estaAutenticado(): boolean {
    return this.usuarioActual !== null;
  }

  /**
   * Cierra la sesión actual.
   */
  cerrarSesion(): void {
    this.usuarioActual = null;
    sessionStorage.removeItem(STORAGE_KEY);
  }
}