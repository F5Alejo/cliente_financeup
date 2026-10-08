import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../services/auth';
import { NotificacionAdmin, NotificacionesService } from '../../../services/notificaciones';
import { IconComponent, NombreIcono } from '../../../shared/components/icon/icon';
import { ToastContainerComponent } from '../../../shared/components/toast-container/toast-container';
import { AdminBusquedaService } from '../../../shared/services/admin-busqueda';
import { tiempoRelativo } from '../../../shared/utils/fechas';

interface ItemNavegacion {
  etiqueta: string;
  icono: NombreIcono;
  ruta?: string;
  exacto?: boolean;
}

interface GrupoNavegacion {
  titulo: string;
  items: ItemNavegacion[];
}

interface InfoRuta {
  titulo: string;
  migas: string[];
  buscaEn: string;
}

const LLAVE_SIDEBAR = 'financeup_admin_sidebar';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ToastContainerComponent],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.css',
})
export class AdminShellComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificacionesService = inject(NotificacionesService);
  private busquedaService = inject(AdminBusquedaService);

  readonly grupos: GrupoNavegacion[] = [
    {
      titulo: 'General',
      items: [
        { etiqueta: 'Dashboard', icono: 'dashboard', ruta: '/admin', exacto: true },
        { etiqueta: 'Usuarios', icono: 'users', ruta: '/admin/usuarios' },
        { etiqueta: 'Roles y permisos', icono: 'shield-check', ruta: '/admin/roles' },
      ],
    },
    {
      titulo: 'Operación',
      items: [
        { etiqueta: 'Finanzas', icono: 'wallet', ruta: '/admin/finanzas' },
        { etiqueta: 'Inversiones', icono: 'trending-up', ruta: '/admin/inversiones' },
        { etiqueta: 'Metas', icono: 'target', ruta: '/admin/metas' },
        { etiqueta: 'Educación', icono: 'graduation-cap', ruta: '/admin/educacion' },
        { etiqueta: 'Alianzas', icono: 'briefcase', ruta: '/admin/alianzas' },
        { etiqueta: 'PQR / Soporte', icono: 'life-buoy', ruta: '/admin/pqr' },
      ],
    },
    {
      titulo: 'Sistema',
      items: [
        { etiqueta: 'Reportes', icono: 'bar-chart', ruta: '/admin/reportes' },
        { etiqueta: 'Notificaciones', icono: 'bell', ruta: '/admin/notificaciones' },
        { etiqueta: 'Auditoría', icono: 'clipboard-list', ruta: '/admin/auditoria' },
        { etiqueta: 'Configuración', icono: 'settings', ruta: '/admin/configuracion' },
      ],
    },
  ];

  colapsado = signal(this.leerColapsado());
  menuMovil = signal(false);
  panel = signal<'notificaciones' | 'perfil' | null>(null);
  busqueda = signal('');

  readonly usuario = this.authService.obtenerUsuario();
  readonly nombre = this.usuario ? `${this.usuario.nombre} ${this.usuario.apellido ?? ''}`.trim() : 'Administrador';
  readonly iniciales = this.nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');

  info = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.leerRuta()),
      startWith(this.leerRuta())
    ),
    { requireSync: true }
  );

  notificaciones = this.notificacionesService.recientes;
  sinLeer = this.notificacionesService.sinLeer;

  constructor() {
    effect(() => {
      this.info();
      this.menuMovil.set(false);
      this.panel.set(null);
    });
  }

  alternarColapso(): void {
    this.colapsado.update((valor) => !valor);
    try {
      localStorage.setItem(LLAVE_SIDEBAR, this.colapsado() ? '1' : '0');
    } catch {
      // El navegador puede bloquear el almacenamiento; la preferencia solo dura la sesión.
    }
  }

  alternarPanel(nombre: 'notificaciones' | 'perfil', evento: Event): void {
    evento.stopPropagation();
    this.panel.update((actual) => (actual === nombre ? null : nombre));
  }

  buscar(): void {
    const texto = this.busqueda().trim();
    this.busquedaService.termino.set(texto);
    this.router.navigateByUrl(this.info().buscaEn);
  }

  abrirNotificacion(notificacion: NotificacionAdmin): void {
    this.notificacionesService.marcarLeida(notificacion.id);
    this.panel.set(null);
    this.router.navigateByUrl(notificacion.ruta);
  }

  marcarTodasLeidas(): void {
    this.notificacionesService.marcarTodasLeidas();
  }

  relativo(fecha: string): string {
    return tiempoRelativo(fecha);
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigateByUrl('/login');
  }

  @HostListener('document:click')
  cerrarPaneles(): void {
    this.panel.set(null);
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    this.panel.set(null);
    this.menuMovil.set(false);
  }

  private leerRuta(): InfoRuta {
    let ruta = this.router.routerState.snapshot.root;
    while (ruta.firstChild) {
      ruta = ruta.firstChild;
    }
    const datos = ruta.data;
    return {
      titulo: datos['titulo'] ?? 'Administración',
      migas: datos['migas'] ?? ['Administración'],
      buscaEn: datos['buscaEn'] ?? '/admin/usuarios',
    };
  }

  private leerColapsado(): boolean {
    try {
      return localStorage.getItem(LLAVE_SIDEBAR) === '1';
    } catch {
      return false;
    }
  }
}
