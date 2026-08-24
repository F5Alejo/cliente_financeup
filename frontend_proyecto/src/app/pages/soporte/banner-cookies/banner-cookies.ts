import { Component } from '@angular/core';

@Component({
  selector: 'app-banner-cookies',
  imports: [],
  templateUrl: './banner-cookies.html',
  styleUrl: './banner-cookies.css',
})
export class BannerCookiesComponent {
  // Texto principal (quemado)
  mensajeCookies: string =
    'Utilizamos las cookies para la optimización de la página web y le mejora de la experiencia en Finance Up, utilizamos cookies propias y de terceros para analizar el tráfico, personalizar la publicidad y mostrarte anuncios relevantes Además, compartimos información sobre el uso que haga del sitio web con nuestros partes de redes sociales, publicidad y análisis web, quienes pueden combinarla con otra información que les haya proporcionado o que hayan recopilado a partir del uso que haya hecho de sus servicios.';

  // Nombres de los botones (quemados)
  textoAceptar: string = 'Aceptar';
  textoFundamentales: string = 'Fundamentales';
  textoCancelar: string = 'Cancelar';

  aceptar(): void {
    console.log('Cookies aceptadas');
  }

  fundamentales(): void {
    console.log('Solo cookies fundamentales');
  }

  cancelar(): void {
    console.log('Cookies rechazadas');
  }
}