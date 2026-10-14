import { DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { AdminBusquedaService } from '../services/admin-busqueda';

/** Estado de paginación de una tabla, calculado a partir del total de filas ya filtradas. */
export function crearPaginador(total: () => number, tamano = 8) {
  const pagina = signal(1);
  const totalPaginas = computed(() => Math.max(1, Math.ceil(total() / tamano)));
  const paginaActual = computed(() => Math.min(pagina(), totalPaginas()));
  const rango = computed(() => {
    const inicio = (paginaActual() - 1) * tamano;
    return { inicio, desde: inicio + 1, hasta: Math.min(inicio + tamano, total()) };
  });

  return {
    tamano,
    totalPaginas,
    paginaActual,
    rango,
    cambiar: (delta: number) => pagina.set(Math.min(Math.max(1, paginaActual() + delta), totalPaginas())),
    reiniciar: () => pagina.set(1),
    /** Recorta una lista a la página actual. */
    recortar: <T>(lista: T[]): T[] => lista.slice(rango().inicio, rango().inicio + tamano),
  };
}

/**
 * Señal que empieza en true y pasa a false tras un instante, para mostrar el skeleton al abrir la vista.
 * Debe llamarse dentro de un contexto de inyección (constructor o inicializador de campo).
 */
export function simularCarga(ms = 700) {
  const cargando = signal(true);
  const temporizador = setTimeout(() => cargando.set(false), ms);
  inject(DestroyRef).onDestroy(() => clearTimeout(temporizador));
  // TODO: al conectar el backend, reemplazar por el estado real de la petición HTTP.
  return cargando;
}

/** Recibe del shell el texto del buscador global y la acción rápida 'nuevo'. Debe llamarse en un contexto de inyección. */
export function enlazarConShell(alBuscar: (texto: string) => void, alCrear?: () => void): void {
  const shell = inject(AdminBusquedaService);

  effect(() => {
    const texto = shell.termino();
    if (texto) {
      untracked(() => {
        alBuscar(texto);
        shell.termino.set('');
      });
    }
  });

  effect(() => {
    if (alCrear && shell.accion() === 'nuevo') {
      untracked(() => {
        alCrear();
        shell.accion.set('');
      });
    }
  });
}

export const normalizarTexto = (texto: string): string =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
