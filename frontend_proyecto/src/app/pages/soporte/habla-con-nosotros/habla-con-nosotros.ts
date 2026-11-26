import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent, NombreIcono } from '../../../shared/components/icon/icon';
import { CONTACTO, enlaceWhatsapp } from '../contacto';

interface Tema {
  icono: NombreIcono;
  titulo: string;
  texto: string;
}

/** "Habla con nosotros": el canal de WhatsApp al frente y los otros canales al lado. */
@Component({
  selector: 'app-habla-con-nosotros',
  imports: [BandaSeccionComponent, IconComponent, RouterLink],
  templateUrl: './habla-con-nosotros.html',
  styleUrl: './habla-con-nosotros.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HablaConNosotrosComponent {
  readonly contacto = CONTACTO;
  readonly enlaceWhatsapp = enlaceWhatsapp();

  readonly temas: Tema[] = [
    {
      icono: 'wallet',
      titulo: 'Tus productos y movimientos',
      texto: 'Un saldo que no cuadra, un movimiento que no reconoces o cómo leer tu libro mayor.',
    },
    {
      icono: 'briefcase',
      titulo: 'Alianzas y beneficios',
      texto: 'Requisitos de una oferta, el estado de tu solicitud o qué tasa te conviene.',
    },
    {
      icono: 'clipboard-list',
      titulo: 'Una PQR radicada',
      texto: 'Ten a mano el número de radicado y te contamos en qué va tu caso.',
    },
  ];
}
