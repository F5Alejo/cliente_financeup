import { Injectable, signal } from '@angular/core';

type EleccionCookies = 'todas' | 'fundamentales' | 'rechazadas';

const STORAGE_KEY = 'financeup_cookies_choice';

@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {
  mostrar = signal(false);

  /**
   * Se llama cada vez que el usuario interactúa con algo en el Home.
   * Si todavía no ha respondido al aviso de cookies, lo muestra.
   */
  registrarInteraccion(): void {
    if (!localStorage.getItem(STORAGE_KEY)) {
      this.mostrar.set(true);
    }
  }

  private responder(eleccion: EleccionCookies): void {
    localStorage.setItem(STORAGE_KEY, eleccion);
    this.mostrar.set(false);
  }

  aceptarTodas(): void {
    this.responder('todas');
  }

  soloFundamentales(): void {
    this.responder('fundamentales');
  }

  cancelar(): void {
    this.responder('rechazadas');
  }
}
