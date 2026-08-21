import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-prueba',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './prueba.html',
  styleUrl: './prueba.css',
})
export class Prueba {
  caracteristicas = [
    { icono: '📊', titulo: 'Controla tus finanzas', texto: 'Visualiza ingresos y gastos en tiempo real.' },
    { icono: '🎯', titulo: 'Define tus metas', texto: 'Establece objetivos de ahorro y síguelos fácilmente.' },
    { icono: '🤝', titulo: 'Alianzas exclusivas', texto: 'Ofertas de bancos y fintech pensadas para tu perfil.' },
    { icono: '🔒', titulo: 'Seguridad garantizada', texto: 'Tu información financiera siempre protegida.' },
  ];
}
