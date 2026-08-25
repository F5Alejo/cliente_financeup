import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast';

interface CategoriaAyuda {
  icono: string;
  titulo: string;
  descripcion: string;
  articulos: number;
  temas: string[];
  ruta: string;
}

interface CanalAtencion {
  icono: string;
  titulo: string;
  descripcion: string;
  disponibilidad: string;
  tiempoRespuesta: string;
  enLinea: boolean;
  buttonLabel: string;
  accion: 'chat' | 'pqr' | 'whatsapp';
  variant: 'green' | 'dark';
}

interface SupportContact {
  label: string;
  value: string;
}

interface SupportBlock {
  titulo: string;
  horario: string;
  contacts: SupportContact[];
}

@Component({
  selector: 'app-centro-ayuda',
  imports: [FormsModule],
  templateUrl: './centro-ayuda.html',
  styleUrl: './centro-ayuda.css',
})
export class CentroAyudaConponent {
  constructor(
    private readonly router: Router,
    private readonly toastService: ToastService,
  ) {}
  

  // Encabezado
  title: string = '¿En qué podemos ayudarte?';
  subtitle: string =
    'Encuentra respuestas rápidas, revisa tus solicitudes o habla directamente con un asesor.';
  searchPlaceholder: string = 'Buscar en preguntas frecuentes...';

  busqueda = signal('');

  // Indicadores del encabezado
  readonly indicadores = [
    { valor: '< 2 h', etiqueta: 'Tiempo de respuesta' },
    { valor: '98%', etiqueta: 'Casos resueltos' },
    { valor: '24/7', etiqueta: 'Canales disponibles' },
  ];

  // Categorías de ayuda
  categorias: CategoriaAyuda[] = [
    {
      icono: '◆',
      titulo: 'Cuenta y acceso',
      descripcion: 'Registro, contraseñas, verificación de identidad y seguridad.',
      articulos: 12,
      temas: [
        '¿Cómo restablecer mi contraseña?',
        'Verificar mi identidad',
        'Activar doble factor',
      ],
      ruta: '/linea-ayuda',
    },
    {
      icono: '↗',
      titulo: 'Movimientos y pagos',
      descripcion: 'Transferencias, recargas, comprobantes y cobros duplicados.',
      articulos: 18,
      temas: [
        '¿Cómo transferir dinero?',
        'Descargar comprobantes',
        'Reportar un cobro duplicado',
      ],
      ruta: '/linea-ayuda',
    },
    {
      icono: '▲',
      titulo: 'Inversiones y metas',
      descripcion: 'Fondos, rendimientos, retiros y seguimiento de tus metas.',
      articulos: 15,
      temas: [
        '¿Cómo invertir en fondos?',
        'Retirar mi inversión',
        'Crear una meta de ahorro',
      ],
      ruta: '/linea-ayuda',
    },
    {
      icono: '★',
      titulo: 'Alianzas y beneficios',
      descripcion: 'Ofertas de aliados, requisitos, cashback y tasas preferenciales.',
      articulos: 9,
      temas: [
        '¿Qué son las alianzas financieras?',
        'Requisitos de una oferta',
        'Cómo mejorar mi tasa',
      ],
      ruta: '/alianzas',
    },
  ];

  readonly categoriasFiltradas = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    if (!texto) return this.categorias;

    return this.categorias.filter(
      (categoria) =>
        categoria.titulo.toLowerCase().includes(texto) ||
        categoria.descripcion.toLowerCase().includes(texto) ||
        categoria.temas.some((tema) => tema.toLowerCase().includes(texto))
    );
  });

  readonly totalArticulos = computed(() =>
    this.categorias.reduce((total, categoria) => total + categoria.articulos, 0)
  );

  // Canales de atención
  canalesTitle: string = 'Habla con nosotros';
  canales: CanalAtencion[] = [
    {
      icono: '💬',
      titulo: 'Chat con un asesor',
      descripcion: '¿Necesitas ayuda personalizada? Chatea con uno de nuestros asesores.',
      disponibilidad: 'Lunes a sábado, 7:00 a.m. – 9:00 p.m.',
      tiempoRespuesta: 'Responde en ~3 minutos',
      enLinea: true,
      buttonLabel: 'Iniciar chat',
      accion: 'chat',
      variant: 'green',
    },
    {
      icono: '🎫',
      titulo: 'Radicar una PQR',
      descripcion: '¿Tienes un problema? Envía un ticket y haz seguimiento a tu caso.',
      disponibilidad: 'Disponible 24/7',
      tiempoRespuesta: 'Respuesta en 48 horas hábiles',
      enLinea: true,
      buttonLabel: 'Crear PQR',
      accion: 'pqr',
      variant: 'dark',
    },
    {
      icono: '📱',
      titulo: 'WhatsApp FinanceUp',
      descripcion: 'Escríbenos desde tu celular y retoma la conversación cuando quieras.',
      disponibilidad: 'Todos los días, 6:00 a.m. – 10:00 p.m.',
      tiempoRespuesta: 'Responde en ~10 minutos',
      enLinea: false,
      buttonLabel: 'Abrir WhatsApp',
      accion: 'whatsapp',
      variant: 'dark',
    },
  ];

  // Bloque de soporte
  supportTitle: string = 'Otros canales de soporte';
  supportBlocks: SupportBlock[] = [
    {
      titulo: 'Soporte general',
      horario: 'Lunes a viernes, 8:00 a.m. – 6:00 p.m.',
      contacts: [
        { label: 'Número de soporte', value: '+57 300 456 7890' },
        { label: 'Correo electrónico', value: 'soporte@financeup.com' },
      ],
    },
    {
      titulo: 'Atención prioritaria',
      horario: 'Sábados y festivos, 9:00 a.m. – 2:00 p.m.',
      contacts: [
        { label: 'Número alternativo', value: '+57 301 987 6543' },
        { label: 'Correo', value: 'ayuda@financeup.com' },
      ],
    },
  ];

  abrirCategoria(categoria: CategoriaAyuda): void {
    this.router.navigate([categoria.ruta]);
  }

  ejecutarCanal(canal: CanalAtencion): void {
    switch (canal.accion) {
      case 'chat':
        this.toastService.info('Conectando con un asesor (simulado)...');
        this.router.navigate(['/linea-ayuda']);
        break;
      case 'pqr':
        this.router.navigate(['/pqr']);
        break;
      case 'whatsapp':
        this.router.navigate(['/habla-con-nosostros']);
        break;
    }
  }
}
