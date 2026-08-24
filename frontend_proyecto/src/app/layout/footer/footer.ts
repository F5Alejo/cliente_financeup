import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FooterColumn {
  title: string;
  links: { label: string; path: string }[];
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  columns: FooterColumn[] = [
    {
      title: 'Explorar',
      links: [
        { label: 'Inicio', path: '/home' },
        { label: 'Educacion', path: '/educacion' },
        { label: 'Alianzas', path: '/alianzas' },
        { label: 'Centro de ayuda', path: '/centro-ayuda' },
        { label: 'Linea de ayuda', path: '/linea-ayuda' },
        { label: 'Finanzas', path: '/finanzas' },
      ]
    },
    {
      title: 'Aprender',
      links: [
        { label: 'Finanzas personales', path: '/educacion' },
        { label: 'Recursos', path: '/educacion' }
      ]
    },
    {
      title: 'Empresa',
      links: [
        { label: 'Aliados', path: '/alianzas' },
        { label: 'Comunidad', path: '/alianzas' }
      ]
    }
  ];
}
