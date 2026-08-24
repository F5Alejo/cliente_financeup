import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  tipo: ToastType;
  texto: string;
}

const DURACION_MS = 4000;

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private contador = 0;

  toasts = signal<ToastMessage[]>([]);

  success(texto: string): void {
    this.mostrar('success', texto);
  }

  error(texto: string): void {
    this.mostrar('error', texto);
  }

  info(texto: string): void {
    this.mostrar('info', texto);
  }

  dismiss(id: number): void {
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }

  private mostrar(tipo: ToastType, texto: string): void {
    const id = ++this.contador;
    this.toasts.update((lista) => [...lista, { id, tipo, texto }]);
    setTimeout(() => this.dismiss(id), DURACION_MS);
  }
}
