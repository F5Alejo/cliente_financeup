import { Component, computed, signal } from '@angular/core';
import { ToastService } from '../../../shared/services/toast';

interface FaqItem {
  question: string;
  answer: string;
  categoria: string;
  lecturaMin: number;
  utilidad: number;
  expanded: boolean;
}

@Component({
  selector: 'app-linea-ayuda',
  imports: [],
  templateUrl: './linea-ayuda.html',
  styleUrl: './linea-ayuda.css',
})
export class LineaAyudaComponent {
  constructor(private readonly toastService: ToastService) {}

  // Banner
  bannerTitle: string = 'Línea de Ayuda';
  bannerDescription: string =
    'Resuelve tus dudas, consulta sobre operaciones o productos y recibe la atención especializada que necesitas a través de nuestros canales de atención al cliente.';
  phoneNumber: string = '607 630 40 00';
  chatButtonLabel: string = 'Iniciar chat';

  readonly bannerDatos = [
    { valor: 'Lun a Sáb', etiqueta: 'Días de atención' },
    { valor: '7am - 9pm', etiqueta: 'Horario' },
    { valor: '~3 min', etiqueta: 'Espera promedio' },
  ];

  // Sección de preguntas
  sectionTitle: string = 'Selecciona el tipo de ayuda que necesitas';

  readonly categorias = ['Todas', 'Cuenta', 'Seguridad', 'Educación', 'Alianzas', 'PQR'];
  readonly categoriaSeleccionada = signal('Todas');

  faqItems: FaqItem[] = [
    {
      question: 'Olvidé mi contraseña, ¿qué debo hacer?',
      answer:
        'Ingresa a la pantalla de inicio de sesión y selecciona "¿Olvidaste tu contraseña?". Te enviaremos un enlace a tu correo registrado para que puedas restablecerla.',
      categoria: 'Cuenta',
      lecturaMin: 1,
      utilidad: 96,
      expanded: false,
    },
    {
      question: '¿La información financiera que veo es segura?',
      answer:
        'Sí. Toda la información se transmite de forma cifrada y cumplimos con los estándares de seguridad exigidos para el manejo de datos financieros.',
      categoria: 'Seguridad',
      lecturaMin: 2,
      utilidad: 93,
      expanded: false,
    },
    {
      question: '¿Qué tipo de cursos ofrece Finance Up?',
      answer:
        'Ofrecemos cursos de educación financiera, inversión, ahorro y planeación presupuestal, tanto para principiantes como para usuarios avanzados.',
      categoria: 'Educación',
      lecturaMin: 2,
      utilidad: 89,
      expanded: false,
    },
    {
      question: '¿Qué son las alianzas financieras?',
      answer:
        'Son acuerdos con entidades del sector financiero que nos permiten ofrecerte beneficios, tasas preferenciales y productos exclusivos.',
      categoria: 'Alianzas',
      lecturaMin: 1,
      utilidad: 91,
      expanded: false,
    },
    {
      question: '¿Qué es una PQR?',
      answer:
        'Una PQR es una Petición, Queja o Reclamo que puedes radicar cuando necesitas reportar un problema o solicitar información sobre nuestros servicios.',
      categoria: 'PQR',
      lecturaMin: 1,
      utilidad: 94,
      expanded: false,
    },
    {
      question: '¿Cuánto tarda la respuesta de una PQR?',
      answer:
        'El tiempo máximo de respuesta es de 48 horas hábiles. Puedes hacer seguimiento del avance desde la sección "Mis PQR".',
      categoria: 'PQR',
      lecturaMin: 1,
      utilidad: 88,
      expanded: false,
    },
  ];

  readonly faqFiltradas = computed(() => {
    const categoria = this.categoriaSeleccionada();
    if (categoria === 'Todas') return this.faqItems;
    return this.faqItems.filter((item) => item.categoria === categoria);
  });

  seleccionarCategoria(categoria: string): void {
    this.categoriaSeleccionada.set(categoria);
  }

  toggleFaq(item: FaqItem): void {
    const wasExpanded = item.expanded;

    // Cierra la pregunta que estuviera abierta
    this.faqItems.forEach((faq) => (faq.expanded = false));

    // Si la seleccionada no estaba abierta, la abre
    item.expanded = !wasExpanded;
  }

  marcarUtil(item: FaqItem): void {
    this.toastService.success('Gracias por tu respuesta, nos ayuda a mejorar.');
    item.expanded = false;
  }

  onChatClick(): void {
    this.toastService.info('El chat en vivo estará disponible próximamente.');
  }
}