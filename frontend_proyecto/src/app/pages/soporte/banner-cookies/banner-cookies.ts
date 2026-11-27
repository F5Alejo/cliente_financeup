import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/services/toast';

// Elección del usuario guardada en el navegador: 'todas' | 'fundamentales' | 'rechazadas'
const CLAVE_COOKIES = 'financeup_cookies';

@Component({
  selector: 'app-banner-cookies',
  imports: [RouterLink],
  templateUrl: './banner-cookies.html',
  styleUrl: './banner-cookies.css',
})
export class BannerCookiesComponent {
  mensajeCookies: string =
    'FinanceUp guarda datos en tu navegador para mantener tu sesión abierta y recordar tus preferencias. ' +
    'No usamos cookies de publicidad. Puedes aceptar todas, dejar solo las fundamentales o rechazarlas.';

  textoAceptar: string = 'Aceptar';
  textoFundamentales: string = 'Fundamentales';
  textoCancelar: string = 'Cancelar';

  private router = inject(Router);
  private toastService = inject(ToastService);

  aceptar(): void {
    this.guardar('todas');
  }

  fundamentales(): void {
    this.guardar('fundamentales');
  }

  cancelar(): void {
    this.guardar('rechazadas');
  }

  private guardar(eleccion: string): void {
    localStorage.setItem(CLAVE_COOKIES, eleccion);
    this.toastService.success('Guardamos tu preferencia de cookies.');
    this.router.navigate(['/']);
  }
}
