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
    'Si aun  tienes dudas sobre nuestros servicios contactanos, Tu voz nos importa';
  buttonLabel: string = 'WhatsApp';

  // Número al que se abrirá el chat de WhatsApp (formato internacional sin '+')
  whatsappNumber: string = '573004567890';

  onWhatsappClick(): void {
    const message = encodeURIComponent('Hola, tengo una duda sobre sus servicios.');
    window.open(`https://wa.me/${this.whatsappNumber}?text=${message}`, '_blank');
  }
}