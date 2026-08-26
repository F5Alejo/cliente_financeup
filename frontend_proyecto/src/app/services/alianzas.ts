import { Injectable, signal } from '@angular/core';

export type TipoAliado = 'Bancos' | 'Fintech' | 'Comercio';
export type Beneficio = '0% Interés' | 'Cashback' | 'Sin Cuota';
export type Perfil = 'Score Alto' | 'Historial Nuevo';
export type FamiliaProducto = 'Créditos' | 'Tarjetas' | 'Ahorro' | 'Comercios';

export interface Tarifa {
  concepto: string;
  valor: string;
}

export interface Pregunta {
  pregunta: string;
  respuesta: string;
}

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

  // Ficha del producto
  familia: FamiliaProducto;
  promesa: string;
  caracteristicas: string[];
  documentos: string[];
  tarifas: Tarifa[];
  preguntas: Pregunta[];
}

export interface Solicitud {
  radicado: string;
  productoId: string;
  producto: string;
  aliado: string;
  monto: number;
  plazoMeses: number;
  nombre: string;
  documento: string;
  correo: string;
  celular: string;
  ingresos: number;
  fecha: string;
  estado: 'En estudio';
}

const DOCUMENTOS_BASE = [
  'Cédula de ciudadanía al día',
  'Certificado laboral no mayor a 30 días',
  'Extractos bancarios de los últimos 3 meses',
];

@Injectable({
  providedIn: 'root'
})
export class AlianzasService {
  // Cambia cuando se radica una solicitud, para refrescar las vistas.
  readonly version = signal(0);

  solicitudes: Solicitud[] = [];

  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
  ofertas: Oferta[] = [
    {
      id: 'banco-andino',
      aliado: 'Banco Andino',
      descripcion:
        'Crédito de libre inversión con hasta 2 puntos menos de tasa si completas los módulos básicos de educación financiera.',
      promesa: 'Baja tu tasa estudiando',
      meta: 'Vence en 7 días · 2.100 solicitudes · ID 8866',
      logoBg: 'linear-gradient(135deg, #0f3d22 0%, #0a5c28 100%)',
      logoText: 'BA',
      ctaPrimaria: 'Solicitar crédito',
      ctaSecundaria: 'Conocer el producto',
      tipo: 'Bancos',
      familia: 'Créditos',
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
      etiquetas: ['Tasa preferencial', 'Sin codeudor', 'Desembolso en 24 h'],
      requisitos: [
        'Ingresos desde 2 SMMLV',
        'Puntaje crediticio sobre 700',
        'Módulos básicos de FinanceUp completados',
      ],
      caracteristicas: [
        'Desembolso a tu cuenta de ahorros en 24 horas hábiles',
        'Puedes abonar a capital cuando quieras, sin penalidad',
        'La tasa baja 0,5 puntos por cada módulo que termines, hasta 2 puntos',
      ],
      documentos: DOCUMENTOS_BASE,
      tarifas: [
        { concepto: 'Tasa de interés', valor: 'Desde 14,9% E.A.' },
        { concepto: 'Estudio de crédito', valor: 'Sin costo' },
        { concepto: 'Seguro de vida deudor', valor: '0,08% mensual sobre el saldo' },
        { concepto: 'Abono extraordinario a capital', valor: 'Sin penalidad' },
      ],
      preguntas: [
        {
          pregunta: '¿Cuándo se aplica el descuento en la tasa?',
          respuesta:
            'Al cierre de cada mes revisamos tus módulos completados y ajustamos la tasa de la siguiente cuota. El descuento máximo acumulado es de 2 puntos.',
        },
        {
          pregunta: '¿Puedo pedirlo si ya tengo otro crédito?',
          respuesta:
            'Sí, siempre que la suma de tus cuotas no supere el 40% de tu ingreso mensual comprobable.',
        },
      ],
    },
    {
      id: 'fintech-luz',
      aliado: 'Fintech Luz',
      descripcion:
        'Tarjeta de crédito digital con 5% de cashback en mercado y transporte, y cuota de manejo en cero durante los primeros 6 meses.',
      promesa: 'Cashback en lo que compras cada semana',
      meta: 'Recomendada · 8.450 solicitudes · ID 2288',
      logoBg: 'linear-gradient(135deg, #1db954 0%, #0a5c28 100%)',
      logoText: 'FL',
      ctaPrimaria: 'Solicitar tarjeta',
      ctaSecundaria: 'Conocer el producto',
      tipo: 'Fintech',
      familia: 'Tarjetas',
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
      etiquetas: ['100% digital', 'Cashback 5%', 'Sin cuota 6 meses'],
      requisitos: [
        'Ser mayor de 18 años',
        'Cédula colombiana vigente',
        'Selfie de verificación de identidad',
      ],
      caracteristicas: [
        'Tarjeta virtual activa apenas te aprueban, la física llega en 5 días',
        'Congela y descongela la tarjeta desde la app cuando quieras',
        'El cashback se abona el primer día hábil del mes siguiente',
      ],
      documentos: ['Cédula de ciudadanía al día', 'Selfie de verificación'],
      tarifas: [
        { concepto: 'Tasa de interés', valor: '18,5% E.A.' },
        { concepto: 'Cuota de manejo', valor: '$0 los primeros 6 meses, luego $19.900' },
        { concepto: 'Avance en cajero', valor: '4,5% del monto, mínimo $9.500' },
        { concepto: 'Reposición por pérdida', valor: '$28.000' },
      ],
      preguntas: [
        {
          pregunta: '¿Sobre qué compras aplica el 5%?',
          respuesta:
            'Supermercados, transporte y estaciones de servicio, con tope de $120.000 de cashback al mes.',
        },
        {
          pregunta: '¿Qué pasa después de los 6 meses sin cuota de manejo?',
          respuesta:
            'La cuota queda en $19.900 mensuales y se exonera cualquier mes en que factures más de $800.000.',
        },
      ],
    },
    {
      id: 'microcredito-ya',
      aliado: 'MicroCrédito Ya',
      descripcion:
        'Préstamos pequeños para construir historial crediticio desde cero, con cuotas quincenales o mensuales.',
      promesa: 'Tu primer crédito, sin historial previo',
      meta: 'Cupo abierto · 1.300 solicitudes · ID 6795',
      logoBg: 'linear-gradient(135deg, #3f4a44 0%, #1b2320 100%)',
      logoText: 'MC',
      ctaPrimaria: 'Solicitar préstamo',
      ctaSecundaria: 'Conocer el producto',
      tipo: 'Fintech',
      familia: 'Créditos',
      beneficio: 'Sin Cuota',
      perfiles: ['Historial Nuevo'],
      categoria: 'Microcrédito',
      tasaDesde: 22,
      montoMaximo: 3_000_000,
      plazoMaximo: 18,
      aprobacion: '1 hora',
      calificacion: 4.3,
      usuarios: 1300,
      compatibilidad: 74,
      destacada: false,
      etiquetas: ['Sin historial', 'Cuotas quincenales'],
      requisitos: ['Documento de identidad vigente', 'Cuenta bancaria a tu nombre'],
      caracteristicas: [
        'Empiezas con $300.000 y el cupo sube cada vez que pagas a tiempo',
        'Eliges cuotas quincenales o mensuales según cómo te paguen',
        'Reportamos tu buen comportamiento a centrales de riesgo',
      ],
      documentos: ['Cédula de ciudadanía al día', 'Certificación de cuenta bancaria'],
      tarifas: [
        { concepto: 'Tasa de interés', valor: '22% E.A.' },
        { concepto: 'Administración por desembolso', valor: '$12.000' },
        { concepto: 'Pago tardío', valor: '$8.500 por cuota vencida' },
      ],
      preguntas: [
        {
          pregunta: '¿Cada cuánto sube mi cupo?',
          respuesta:
            'Después de tres cuotas pagadas a tiempo revisamos tu cupo y puede subir hasta un 40%.',
        },
      ],
    },
    {
      id: 'banco-verde',
      aliado: 'Banco Verde',
      descripcion:
        'Crédito hipotecario con tasa fija durante toda la vigencia y un asesor asignado hasta la escritura.',
      promesa: 'Tasa fija de principio a fin',
      meta: 'Vence en 21 días · 940 solicitudes · ID 4410',
      logoBg: 'linear-gradient(135deg, #0a5c28 0%, #17a34a 100%)',
      logoText: 'BV',
      ctaPrimaria: 'Solicitar crédito',
      ctaSecundaria: 'Conocer el producto',
      tipo: 'Bancos',
      familia: 'Créditos',
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
      etiquetas: ['Tasa fija', 'Asesor asignado', 'Compatible con subsidio'],
      requisitos: [
        'Ingresos desde 4 SMMLV',
        'Cuota inicial del 20% del valor del inmueble',
        'Antigüedad laboral de un año',
      ],
      caracteristicas: [
        'Financiamos hasta el 80% del valor comercial del inmueble',
        'La tasa no cambia aunque suba la del mercado',
        'Un asesor te acompaña desde el avalúo hasta la firma de escritura',
      ],
      documentos: [
        ...DOCUMENTOS_BASE,
        'Promesa de compraventa firmada',
        'Declaración de renta del último año',
      ],
      tarifas: [
        { concepto: 'Tasa de interés', valor: 'Desde 11,4% E.A. fija' },
        { concepto: 'Avalúo del inmueble', valor: 'Desde $380.000' },
        { concepto: 'Estudio de títulos', valor: '$420.000' },
        { concepto: 'Seguro de incendio y terremoto', valor: 'Según valor asegurado' },
      ],
      preguntas: [
        {
          pregunta: '¿Puedo usar el subsidio de vivienda?',
          respuesta:
            'Sí. El subsidio se aplica como parte de la cuota inicial y no reduce el monto máximo que podemos financiarte.',
        },
        {
          pregunta: '¿Cuánto tarda el desembolso?',
          respuesta:
            'La aprobación toma 5 días hábiles y el desembolso ocurre el día de la firma de escritura.',
        },
      ],
    },
    {
      id: 'tienda-mas',
      aliado: 'Tienda Más',
      descripcion:
        'Compra ahora y paga después sin intereses en más de 300 comercios aliados en Colombia.',
      promesa: 'Difiere sin intereses en comercios aliados',
      meta: 'Vigente todo el año · 5.700 activaciones · ID 1902',
      logoBg: 'linear-gradient(135deg, #17a34a 0%, #0f3d22 100%)',
      logoText: 'TM',
      ctaPrimaria: 'Activar el cupo',
      ctaSecundaria: 'Conocer el producto',
      tipo: 'Comercio',
      familia: 'Comercios',
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
      etiquetas: ['0% interés', '300 comercios', 'Aprobación inmediata'],
      requisitos: ['Cuenta FinanceUp activa', 'Sin moras vigentes'],
      caracteristicas: [
        'Difiere a 3, 6 o 12 cuotas sin interés en comercios de la red',
        'El cupo se libera de nuevo a medida que pagas',
        'Pagas desde la app, sin ir al comercio',
      ],
      documentos: ['Cédula de ciudadanía al día'],
      tarifas: [
        { concepto: 'Interés corriente', valor: '0% en comercios aliados' },
        { concepto: 'Cuota de manejo', valor: 'Sin costo' },
        { concepto: 'Mora', valor: 'Tasa máxima legal vigente' },
      ],
      preguntas: [
        {
          pregunta: '¿Dónde puedo usar el cupo?',
          respuesta:
            'En los comercios marcados con el sello Tienda Más dentro de la app. La lista se actualiza cada mes.',
        },
      ],
    },
    {
      id: 'ahorro-plus',
      aliado: 'Ahorro Plus',
      descripcion:
        'Cuenta de ahorro con rendimiento diario y devolución del 3% sobre tus compras recurrentes.',
      promesa: 'Tu saldo rinde todos los días',
      meta: 'Nuevo aliado · 620 aperturas · ID 7731',
      logoBg: 'linear-gradient(135deg, #6b7c72 0%, #1b2320 100%)',
      logoText: 'AP',
      ctaPrimaria: 'Abrir la cuenta',
      ctaSecundaria: 'Conocer el producto',
      tipo: 'Comercio',
      familia: 'Ahorro',
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
      requisitos: ['Documento de identidad vigente', 'Correo verificado'],
      caracteristicas: [
        'Los rendimientos se abonan cada día sobre el saldo disponible',
        'Sin monto mínimo de apertura ni saldo mínimo',
        'Retiras sin costo en la red de cajeros aliados',
      ],
      documentos: ['Cédula de ciudadanía al día'],
      tarifas: [
        { concepto: 'Rendimiento', valor: '9,2% E.A. sobre el saldo diario' },
        { concepto: 'Cuota de manejo', valor: 'Sin costo' },
        { concepto: 'Retiro en cajeros de otra red', valor: '$7.600' },
        { concepto: 'Cuatro por mil', valor: 'Exenta hasta 350 UVT al mes' },
      ],
      preguntas: [
        {
          pregunta: '¿El rendimiento es fijo?',
          respuesta:
            'Es variable y sigue la tasa del mercado. Te avisamos por la app cada vez que cambia.',
        },
      ],
    },
  ];

  buscarOferta(id: string): Oferta | undefined {
    return this.ofertas.find((o) => o.id === id);
  }

  ofertasDeFamilia(familia: FamiliaProducto): Oferta[] {
    return this.ofertas.filter((o) => o.familia === familia);
  }

  /** Radica la solicitud y devuelve el número con el que el usuario hace seguimiento. */
  radicarSolicitud(datos: Omit<Solicitud, 'radicado' | 'fecha' | 'estado'>): Solicitud {
    const solicitud: Solicitud = {
      ...datos,
      radicado: `SOL-${Math.floor(100000 + Math.random() * 899999)}`,
      fecha: new Date().toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      estado: 'En estudio',
    };

    this.solicitudes.push(solicitud);
    this.version.update((v) => v + 1);
    return solicitud;
  }

  agregarOferta(oferta: Oferta): void {
    this.ofertas.push(oferta);
  }

  editarOferta(id: string, cambios: Partial<Oferta>): void {
    const oferta = this.buscarOferta(id);
    if (oferta) {
      Object.assign(oferta, cambios);
    }
  }

  eliminarOferta(id: string): void {
    this.ofertas = this.ofertas.filter((o) => o.id !== id);
  }
}
