import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';

interface MenuItem {
  icono: string;
  nombre: string;
  ruta: string;
}

@Component({
  selector: 'app-menu',
  imports: [RouterModule],
  templateUrl: './menu.html',
  styleUrls: [],
})
export class MenuComponent implements OnInit {
  constructor(private authService: AuthService) {}

  nombreSistema = 'FINANCE UP';
  usuario = '';

  menu: MenuItem[] = [
    { icono: '[]', nombre: 'Resumen', ruta: '/finanzas' },
    { icono: '^', nombre: 'Educacion', ruta: '/educacion' },
    { icono: '*', nombre: 'Alianzas', ruta: '/alianzas' },
  ];

  ngOnInit(): void {
    this.usuario = this.authService.obtenerNombre();
  }

  nuevoMovimiento(): void {
    // Punto de extension: abrir el formulario/modal de nuevo movimiento.
  }

  get inicialUsuario(): string {
    return this.usuario ? this.usuario.charAt(0).toUpperCase() : '';
  }
}
