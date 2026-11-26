import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/services/toast';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';
import { CONTACTO, enlaceWhatsapp } from '../contacto';

interface FaqItem {
  question: string;
  answer: string;
  categoria: string;
  lecturaMin: number;
  expanded: boolean;
}

@Component({
  selector: 'app-linea-ayuda',
  imports: [BandaSeccionComponent, IconComponent, RouterLink],
  templateUrl: './linea-ayuda.html',
  styleUrl: './linea-ayuda.css',
})
export class LineaAyudaComponent {
  constructor(
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
  ) {
    this.route.queryParamMap.subscribe((params) => {
      this.busqueda.set(params.get('busqueda') ?? '');
      const categoria = params.get('categoria');
      this.categoriaSeleccionada.set(
        categoria && this.categorias.includes(categoria) ? categoria : 'Todas',
      );
    });
  }

  // Banda
  readonly bannerDescription =
    'Resuelve dudas sobre tu cuenta, tus movimientos o un producto aliado con una persona del equipo.';
  readonly contacto = CONTACTO;
  readonly enlaceWhatsapp = enlaceWhatsapp();

  readonly horarios = [
    { etiqueta: `Línea, ${CONTACTO.diasLinea.toLowerCase()}`, valor: CONTACTO.horarioLinea },
    { etiqueta: `WhatsApp, ${CONTACTO.diasWhatsapp.toLowerCase()}`, valor: CONTACTO.horarioWhatsapp },
    { etiqueta: 'Respuesta a una PQR', valor: CONTACTO.respuestaPqr },
  ];

  // Sección de preguntas
  readonly sectionTitle = 'Preguntas frecuentes';

  readonly categorias = ['Todas', 'Cuenta', 'Seguridad', 'Educación', 'Alianzas', 'PQR'];
  readonly categoriaSeleccionada = signal('Todas');
  readonly busqueda = signal('');

  faqItems: FaqItem[] = [
    {
      question: 'Olvidé mi contraseña, ¿qué debo hacer?',
      answer:
        'Ingresa a la pantalla de inicio de sesión y selecciona "¿Olvidaste tu contraseña?". Te enviaremos un enlace a tu correo registrado para que puedas restablecerla.',
      categoria: 'Cuenta',
      lecturaMin: 1,
      expanded: false,
    },
    {
      question: '¿La información financiera que veo es segura?',
      answer:
        'Sí. Toda la información se transmite de forma cifrada y cumplimos con los estándares de seguridad exigidos para el manejo de datos financieros.',
      categoria: 'Seguridad',
      lecturaMin: 2,
      expanded: false,
    },
    {
      question: '¿Qué tipo de cursos ofrece Finance Up?',
      answer:
        'Ofrecemos cursos de educación financiera, inversión, ahorro y planeación presupuestal, tanto para principiantes como para usuarios avanzados.',
      categoria: 'Educación',
      lecturaMin: 2,
      expanded: false,
    },
    {
      question: '¿Qué son las alianzas financieras?',
      answer:
        'Son acuerdos con entidades del sector financiero que nos permiten ofrecerte beneficios, tasas preferenciales y productos exclusivos.',
      categoria: 'Alianzas',
      lecturaMin: 1,
      expanded: false,
    },
    {
      question: '¿Qué es una PQR?',
      answer:
        'Una PQR es una Petición, Queja o Reclamo que puedes radicar cuando necesitas reportar un problema o solicitar información sobre nuestros servicios.',
      categoria: 'PQR',
      lecturaMin: 1,
      expanded: false,
    },
    {
      question: '¿Cuánto tarda la respuesta de una PQR?',
      answer:
        'El tiempo máximo de respuesta es de 48 horas hábiles. Puedes hacer seguimiento del avance desde la sección "Mis PQR".',
      categoria: 'PQR',
      lecturaMin: 1,
      expanded: false,
    },
  ];

  readonly faqFiltradas = computed(() => {
    const categoria = this.categoriaSeleccionada();
    const termino = this.normalizarTexto(this.busqueda());

    return this.faqItems.filter((item) => {
      const coincideCategoria = categoria === 'Todas' || item.categoria === categoria;
      const coincideBusqueda =
        !termino ||
        [item.question, item.answer, item.categoria].some((texto) =>
          this.normalizarTexto(texto).includes(termino),
        );

      return coincideCategoria && coincideBusqueda;
    });
  });

  private normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

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
    this.toastService.success('Gracias por contarnos, nos ayuda a mejorar.');
    item.expanded = false;
  }

  /** id estable de la respuesta, para enlazarla con su botón (aria-controls). */
  idRespuesta(i: number): string {
    return `faq-respuesta-${i}`;
  }
}
