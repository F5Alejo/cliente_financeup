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
  items: SubMenuItem[] = [
    { nombre: 'Finanzas', ruta: '/finanzas' },
    { nombre: 'Inversiones', ruta: '/inversiones' },
    { nombre: 'Metas', ruta: '/metas' },
    { nombre: 'Libro Mayor', ruta: '/libro-mayor' },
    { nombre: 'Resuelve Tu Deuda', ruta: '/resuelve-deuda' },
  ];
}