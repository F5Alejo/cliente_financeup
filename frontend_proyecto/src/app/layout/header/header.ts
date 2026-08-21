import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RouterOutlet } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
  exact: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  navItems: NavItem[] = [
    { label: 'Inicio', path: '/prueba', exact: true },
    { label: 'Educacion', path: '/educacion', exact: false },
    { label: 'Alianzas', path: '/alianzas', exact: false },
    { label: 'Finanzas', path: '/finanzas', exact: false },
    { label: 'Soporte', path: '/centro-ayuda', exact: false },
  ];
}
