/**
 * Node 25+ trae su propio `localStorage`/`sessionStorage` global y, sin la bandera
 * `--localstorage-file`, lo deja en `undefined`, tapando el de jsdom. Los services
 * del cliente guardan la sesión y los datos simulados ahí, así que en los tests
 * se pone un Storage en memoria cuando falta.
 */
class StorageEnMemoria implements Storage {
  private datos = new Map<string, string>();

  get length(): number {
    return this.datos.size;
  }

  clear(): void {
    this.datos.clear();
  }

  getItem(clave: string): string | null {
    return this.datos.get(clave) ?? null;
  }

  key(indice: number): string | null {
    return [...this.datos.keys()][indice] ?? null;
  }

  removeItem(clave: string): void {
    this.datos.delete(clave);
  }

  setItem(clave: string, valor: string): void {
    this.datos.set(clave, String(valor));
  }
}

for (const nombre of ['localStorage', 'sessionStorage'] as const) {
  if (!globalThis[nombre]) {
    Object.defineProperty(globalThis, nombre, {
      value: new StorageEnMemoria(),
      configurable: true,
      writable: true,
    });
  }
}
