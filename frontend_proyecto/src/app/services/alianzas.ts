import { Injectable } from '@angular/core';

export interface Oferta {
  id: string;
  aliado: string;
  descripcion: string;
  meta: string;
  logoBg: string;
  logoText: string;
  ctaPrimaria: string;
  ctaSecundaria?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlianzasService {
  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
  ofertas: Oferta[] = [
    {
      id: 'banco-andino',
      aliado: 'Banco Andino',
      descripcion: 'Hasta 2 puntos menos en tasa si completas los módulos básicos.',
      meta: 'Vence en 7 días · 2.1k usuarios · ID 8866',
      logoBg: '#0d1f4d',
      logoText: 'BA',
      ctaPrimaria: 'Aplicar',
    },
    {
      id: 'fintech-luz',
      aliado: 'Fintech Luz',
      descripcion: '5% de cashback en compras esenciales y 0% cuota de manejo por 6 meses.',
      meta: 'Recomendado · Válido este mes · ID 2288',
      logoBg: '#111111',
      logoText: 'FINTECH',
      ctaPrimaria: 'Solicitar',
      ctaSecundaria: 'Guardar',
    },
    {
      id: 'microcredito-ya',
      aliado: 'MicroCrédito Ya',
      descripcion: 'Préstamos pequeños para construir historial.',
      meta: 'ID 6795',
      logoBg: '#0f2a1f',
      logoText: 'MC',
      ctaPrimaria: 'Solicitar',
    },
  ];

  agregarOferta(oferta: Oferta): void {
    this.ofertas.push(oferta);
  }

  editarOferta(id: string, cambios: Partial<Oferta>): void {
    const oferta = this.ofertas.find((o) => o.id === id);
    if (oferta) {
      Object.assign(oferta, cambios);
    }
  }

  eliminarOferta(id: string): void {
    this.ofertas = this.ofertas.filter((o) => o.id !== id);
  }
}
