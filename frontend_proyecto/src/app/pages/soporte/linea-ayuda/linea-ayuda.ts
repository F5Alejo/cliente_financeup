import { Component } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
  expanded: boolean;
}

@Component({
  selector: 'app-linea-ayuda',
  imports: [],
  templateUrl: './linea-ayuda.html',
  styleUrl: './linea-ayuda.css',
})
export class LineaAyudaComponent {

  // Banner
  bannerTitle: string = 'Línea de Ayuda';
  bannerDescription: string =
    'Resuelve tus dudas, consulta sobre operaciones o productos y recibe la atención especializada que necesitas a través de nuestros canales de atención al cliente.';
  phoneNumber: string = '607 630 40 00';
  chatButtonLabel: string = 'Chat';

  // Sección de preguntas
  sectionTitle: string = 'Selecciona el tipo de ayuda que necesitas';

  faqItems: FaqItem[] = [
    {
      question: 'Olvidé mi contraseña, ¿qué debo hacer?',
      answer:
        'Ingresa a la pantalla de inicio de sesión y selecciona "¿Olvidaste tu contraseña?". Te enviaremos un enlace a tu correo registrado para que puedas restablecerla.',
      expanded: false,
    },
    {
      question: '¿La información financiera que veo es segura?',
      answer:
        'Sí. Toda la información se transmite de forma cifrada y cumplimos con los estándares de seguridad exigidos para el manejo de datos financieros.',
      expanded: false,
    },
    {
      question: '¿Qué tipo de cursos ofrece Finance Up?',
      answer:
        'Ofrecemos cursos de educación financiera, inversión, ahorro y planeación presupuestal, tanto para principiantes como para usuarios avanzados.',
      expanded: false,
    },
    {
      question: '¿Qué son las alianzas financieras?',
      answer:
        'Son acuerdos con entidades del sector financiero que nos permiten ofrecerte beneficios, tasas preferenciales y productos exclusivos.',
      expanded: false,
    },
    {
      question: '¿Qué es una PQR?',
      answer:
        'Una PQR es una Petición, Queja o Reclamo que puedes radicar cuando necesitas reportar un problema o solicitar información sobre nuestros servicios.',
      expanded: false,
    },
  ];

  toggleFaq(item: FaqItem): void {
    const wasExpanded = item.expanded;

    // Cierra la pregunta que estuviera abierta
    this.faqItems.forEach((faq) => (faq.expanded = false));

    // Si la seleccionada no estaba abierta, la abre
    item.expanded = !wasExpanded;
  }

  onChatClick(): void {
    console.log('Abrir chat de la línea de ayuda');
  }
}