import { Injectable } from '@angular/core';

export type TipoAliado = 'Bancos' | 'Fintech' | 'Comercio';
export type Beneficio = '0% Interés' | 'Cashback' | 'Sin Cuota';
export type Perfil = 'Score Alto' | 'Historial Nuevo';

export interface Oferta {
  id: string;
  aliado: string;
  descripcion: string;
  meta: string;
  logoBg: string;
  logoText: string;
  ctaPrimaria: string;
  ctaSecundaria?: string;

  // Clasificación para los filtros
  tipo: TipoAliado;
  beneficio: Beneficio;
  perfiles: Perfil[];

  // Datos visibles en la tarjeta
  categoria: string;
  tasaDesde: number;
  montoMaximo: number;
  plazoMaximo: number;
  aprobacion: string;
  calificacion: number;
  usuarios: number;
  compatibilidad: number;
  destacada: boolean;
  etiquetas: string[];
  requisitos: string[];
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
      descripcion:
        'Hasta 2 puntos menos en tasa si completas los módulos básicos de educación financiera.',
      meta: 'Vence en 7 días · 2.1k usuarios · ID 8866',
      logoBg: 'linear-gradient(135deg, #0f3d22 0%, #0a5c28 100%)',
      logoText: 'BA',
      ctaPrimaria: 'Aplicar',
      ctaSecundaria: 'Guardar',
      tipo: 'Bancos',
      beneficio: '0% Interés',
      perfiles: ['Score Alto'],
      categoria: 'Crédito de libre inversión',
      tasaDesde: 14.9,
      montoMaximo: 80_000_000,
      plazoMaximo: 60,
      aprobacion: '24 horas',
      calificacion: 4.8,
      usuarios: 2100,
      compatibilidad: 92,
      destacada: true,
      etiquetas: ['Tasa preferencial', 'Sin codeudor', 'Desembolso rápido'],
      requisitos: [
        'Ingresos desde 2 SMMLV',
        'Score crediticio sobre 700',
        'Módulos básicos completados',
      ],
    },
    {
      id: 'fintech-luz',
      aliado: 'Fintech Luz',
      descripcion:
        '5% de cashback en compras esenciales y 0% cuota de manejo durante los primeros 6 meses.',
      meta: 'Recomendado · Válido este mes · ID 2288',
      logoBg: 'linear-gradient(135deg, #1db954 0%, #0a5c28 100%)',
      logoText: 'FL',
      ctaPrimaria: 'Solicitar',
      ctaSecundaria: 'Guardar',
      tipo: 'Fintech',
      beneficio: 'Cashback',
      perfiles: ['Score Alto', 'Historial Nuevo'],
      categoria: 'Tarjeta de crédito digital',
      tasaDesde: 18.5,
      montoMaximo: 12_000_000,
      plazoMaximo: 36,
      aprobacion: '10 minutos',
      calificacion: 4.6,
      usuarios: 8450,
      compatibilidad: 87,
      destacada: true,
      etiquetas: ['100% digital', 'Cashback 5%', 'Sin cuota de manejo'],
      requisitos: ['Mayor de 18 años', 'Cédula colombiana', 'Selfie de verificación'],
    },
    {
      id: 'microcredito-ya',
      aliado: 'MicroCrédito Ya',
      descripcion:
        'Préstamos pequeños diseñados para construir historial crediticio desde cero.',
      meta: 'Cupo abierto · 1.3k usuarios · ID 6795',
      logoBg: 'linear-gradient(135deg, #3f4a44 0%, #1b2320 100%)',
      logoText: 'MC',
      ctaPrimaria: 'Solicitar',
      tipo: 'Fintech',
      beneficio: 'Sin Cuota',
      perfiles: ['Historial Nuevo'],
      categoria: 'Microcrédito',
      tasaDesde: 22.0,
      montoMaximo: 3_000_000,
      plazoMaximo: 18,
      aprobacion: '1 hora',
      calificacion: 4.3,
      usuarios: 1300,
      compatibilidad: 74,
      destacada: false,
      etiquetas: ['Sin historial', 'Cuotas flexibles'],
      requisitos: ['Documento de identidad', 'Cuenta bancaria activa'],
    },
    {
      id: 'banco-verde',
      aliado: 'Banco Verde',
      descripcion:
        'Crédito de vivienda con tasa fija y acompañamiento de un asesor durante todo el proceso.',
      meta: 'Vence en 21 días · 940 usuarios · ID 4410',
      logoBg: 'linear-gradient(135deg, #0a5c28 0%, #17a34a 100%)',
      logoText: 'BV',
      ctaPrimaria: 'Aplicar',
      ctaSecundaria: 'Simular',
      tipo: 'Bancos',
      beneficio: '0% Interés',
      perfiles: ['Score Alto'],
      categoria: 'Crédito hipotecario',
      tasaDesde: 11.4,
      montoMaximo: 350_000_000,
      plazoMaximo: 240,
      aprobacion: '5 días hábiles',
      calificacion: 4.7,
      usuarios: 940,
      compatibilidad: 81,
      destacada: false,
      etiquetas: ['Tasa fija', 'Asesor dedicado', 'Subsidio compatible'],
      requisitos: [
        'Ingresos desde 4 SMMLV',
        'Cuota inicial del 20%',
        'Antigüedad laboral de 1 año',
      ],
    },
    {
      id: 'tienda-mas',
      aliado: 'Tienda Más',
      descripcion:
        'Compra ahora y paga después sin intereses en más de 300 comercios aliados del país.',
      meta: 'Promoción permanente · 5.7k usuarios · ID 1902',
      logoBg: 'linear-gradient(135deg, #17a34a 0%, #0f3d22 100%)',
      logoText: 'TM',
      ctaPrimaria: 'Activar',
      ctaSecundaria: 'Ver comercios',
      tipo: 'Comercio',
      beneficio: '0% Interés',
      perfiles: ['Score Alto', 'Historial Nuevo'],
      categoria: 'Compra ahora, paga después',
      tasaDesde: 0,
      montoMaximo: 5_000_000,
      plazoMaximo: 12,
      aprobacion: 'Inmediata',
      calificacion: 4.5,
      usuarios: 5700,
      compatibilidad: 78,
      destacada: false,
      etiquetas: ['0% interés', '300+ comercios', 'Aprobación inmediata'],
      requisitos: ['Cuenta FinanceUp activa', 'Sin moras vigentes'],
    },
    {
      id: 'ahorro-plus',
      aliado: 'Ahorro Plus',
      descripcion:
        'Cuenta de ahorro con rendimiento diario y devolución del 3% sobre tus compras recurrentes.',
      meta: 'Nuevo aliado · 620 usuarios · ID 7731',
      logoBg: 'linear-gradient(135deg, #6b7c72 0%, #1b2320 100%)',
      logoText: 'AP',
      ctaPrimaria: 'Abrir cuenta',
      tipo: 'Comercio',
      beneficio: 'Cashback',
      perfiles: ['Historial Nuevo'],
      categoria: 'Cuenta de ahorro',
      tasaDesde: 0,
      montoMaximo: 0,
      plazoMaximo: 0,
      aprobacion: '15 minutos',
      calificacion: 4.4,
      usuarios: 620,
      compatibilidad: 69,
      destacada: false,
      etiquetas: ['Rendimiento diario', 'Sin cuota de manejo', 'Cashback 3%'],
      requisitos: ['Documento de identidad', 'Correo verificado'],
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
