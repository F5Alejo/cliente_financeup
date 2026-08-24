import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../shared/services/toast';

interface NavItem {
  label: string;
  path: string;
  exact: boolean;
  requiereSesion?: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  constructor(
    public authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  menuAbierto = false;

  navItems: NavItem[] = [
    { label: 'Inicio', path: '/home', exact: true },
    { label: 'Educacion', path: '/educacion', exact: false },
    { label: 'Alianzas', path: '/alianzas', exact: false },
    { label: 'Finanzas', path: '/finanzas', exact: false, requiereSesion: true },
    { label: 'Soporte', path: '/centro-ayuda', exact: false },
  ];

  get navItemsVisibles(): NavItem[] {
    const autenticado = this.authService.estaAutenticado();
    return this.navItems.filter((item) => !item.requiereSesion || autenticado);
  }

  get iniciales(): string {
    const nombre = this.authService.obtenerNombre();
    return nombre.charAt(0).toUpperCase();
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  cerrarSesion(): void {
    this.cerrarMenu();
    this.authService.cerrarSesion();
    this.toastService.info('Sesión cerrada correctamente.');
    this.router.navigateByUrl('/login');
  }
}
