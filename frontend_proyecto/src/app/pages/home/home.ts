import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CookieConsentComponent } from '../../shared/components/cookie-consent/cookie-consent';
import { CookieConsentService } from '../../shared/services/cookie-consent';

interface Caracteristica {
  icono: string;
  titulo: string;
  descripcion: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CookieConsentComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  constructor(private cookieConsentService: CookieConsentService) {}

  caracteristicas: Caracteristica[] = [
    { icono: '📊', titulo: 'Dashboard Intuitivo', descripcion: 'Visualiza todas tus finanzas en un solo lugar con gráficos interactivos y reportes en tiempo real.' },
    { icono: '🔒', titulo: 'Seguridad Bancaria', descripcion: 'Encriptación de nivel bancario y autenticación de dos factores para proteger tu información financiera.' },
    { icono: '🏦', titulo: 'Conecta con Bancos', descripcion: 'Encuentra una variedad de bancos donde podrás conectarte directamente con sus asesores.' },
    { icono: '💼', titulo: 'Gestión de Presupuestos', descripcion: 'Crea y monitorea presupuestos personalizados con alertas automáticas de gastos y ahorro.' },
    { icono: '🌐', titulo: 'Múltiples Monedas', descripcion: 'Soporte para más de 150 monedas con conversión automática y tasas actualizadas al instante.' },
    { icono: '🌎', titulo: 'En todo el mundo', descripcion: 'Ingresa desde cualquier parte del mundo a través de nuestra página web.' },
  ];

  interactuar(): void {
    this.cookieConsentService.registrarInteraccion();
  }

  verCaracteristicas(): void {
    this.interactuar();
    document.getElementById('caracteristicas')?.scrollIntoView({ behavior: 'smooth' });
  }
}
