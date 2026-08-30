import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'

interface SubMenuItem {
  nombre: string;
  ruta: string;
}

@Component({
  selector: 'app-finanzas-menu',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './finanzas-menu.html',
  styleUrl: './finanzas-menu.css',
})
export class FinanzasMenuComponent {
  // Ítems del menú de navegación del módulo de finanzas.
  // Cada uno debe apuntar a una ruta registrada en app.routes.ts.
  items: SubMenuItem[] = [
    { nombre: 'Finanzas', ruta: '/finanzas' },
    { nombre: 'Inversiones', ruta: '/inversiones' },
    { nombre: 'Metas', ruta: '/metas' },
    { nombre: 'Libro-Mayor', ruta: '/libro-mayor' },
    { nombre: 'Resuelve-Deuda', ruta: '/resuelve-deuda' },
    { nombre: 'Herramientas', ruta: '/herramientas' },
  ];
}
