import { Component } from '@angular/core';

@Component({
  selector: 'app-habla-con-nosotros',
  imports: [],
  templateUrl: './habla-con-nosotros.html',
  styleUrl: './habla-con-nosotros.css',
})
export class HablaConNosotrosComponent {

  title: string = 'Habla Con Nosotros';
  description: string =
    'Si aún tienes dudas sobre nuestros servicios contáctanos. Tu voz nos importa.';
  buttonLabel: string = 'Escribir por WhatsApp';

  // Datos de atención
  readonly datosAtencion = [
    { valor: '~10 min', etiqueta: 'Tiempo de respuesta' },
    { valor: '6am - 10pm', etiqueta: 'Horario de atención' },
    { valor: '4.8 / 5', etiqueta: 'Satisfacción' },
  ];

  readonly temas = [
    'Estado de tus productos y movimientos',
    'Ayuda con alianzas y beneficios',
    'Seguimiento a una PQR radicada',
  ];

  // Número al que se abrirá el chat de WhatsApp (formato internacional sin '+')
  whatsappNumber: string = '573004567890';

  onWhatsappClick(): void {
    const message = encodeURIComponent('Hola, tengo una duda sobre sus servicios.');
    window.open(`https://wa.me/${this.whatsappNumber}?text=${message}`, '_blank');
  }
}
