import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast';

interface ActionCard {
  title: string;
  description: string;
  buttonLabel: string;
  variant: 'dark' | 'green';
}
 
interface SupportContact {
  label: string;
  value: string;
}
 
interface SupportBlock {
  contacts: SupportContact[];
}

@Component({
  selector: 'app-centro-ayuda',
  imports: [],
  templateUrl: './centro-ayuda.html',
  styleUrl: './centro-ayuda.css',
})
export class CentroAyudaConponent {
  constructor(
    private router: Router,
    private toastService: ToastService
  ) {}

  // Encabezado
  title: string = '¿En qué podemos ayudarte?';
  searchPlaceholder: string = 'Buscar en preguntas frecuentes...';
 
  // Tarjeta de preguntas frecuentes
  faqCardTitle: string = 'Preguntas Frecuentes';
  faqQuestions: string[] = [
    '¿Cómo transferir dinero?',
    '¿Cómo invertir en fondos?',
    '¿Cómo restablecer mi contraseña?',
  ];
  faqButtonLabel: string = 'Ver Más';
 
  // Tarjetas de acción (Asesor y PQR)
  actionCards: ActionCard[] = [
    {
      title: 'Hablar con un Asesor',
      description:
        '¿Necesitas ayuda personalizada? Chatea con uno de nuestros asesores en línea.',
      buttonLabel: 'Iniciar Chat',
      variant: 'green',
    },
    {
      title: 'Enviar PQR',
      description:
        '¿Tienes algún problema? Envíanos un ticket y te responderemos pronto.',
      buttonLabel: 'Crear PQR',
      variant: 'dark',
    },
  ];
 
  // Bloque de soporte
  supportTitle: string = 'Soporte';
  supportBlocks: SupportBlock[] = [
    {
      contacts: [
        { label: 'Número de Soporte:', value: '+57 300 456 7890' },
        { label: 'Correo Electrónico:', value: 'soporte@financeup.com' },
      ],
    },
    {
      contacts: [
        { label: 'Número Alternativo:', value: '+57 301 987 6543' },
        { label: 'Correo:', value: 'ayuda@financeup.com' },
      ],
    },
  ];
 
  onVerMasFaq(): void {
    this.router.navigate(['/linea-ayuda']);
  }

  onIniciarChat(): void {
    this.toastService.info('Conectando con un asesor (simulado)...');
    this.router.navigate(['/linea-ayuda']);
  }

  onCrearPqr(): void {
    this.router.navigate(['/pqr']);
  }
}
 
