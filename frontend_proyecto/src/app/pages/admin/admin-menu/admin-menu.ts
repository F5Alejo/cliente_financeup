import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

interface AdminMenuItem {
  nombre: string;
  ruta: string;
}

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './admin-menu.html',
  styleUrl: './admin-menu.css',
})
export class AdminMenuComponent {
  items: AdminMenuItem[] = [
    { nombre: 'Resumen', ruta: '/admin' },
    { nombre: 'Alianzas', ruta: '/admin/alianzas' },
    { nombre: 'Educación', ruta: '/admin/educacion' },
    { nombre: 'Finanzas', ruta: '/admin/finanzas' },
    { nombre: 'PQR', ruta: '/admin/pqr' },
  ];
}
