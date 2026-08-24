import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nuevo-pqr',
  imports: [FormsModule],
  templateUrl: './nuevo-pqr.html',
  styleUrl: './nuevo-pqr.css',
})
export class NuevoPqrComponent {
  // Textos de la interfaz (quemados)
  titulo: string = 'Nuevo PQR';
  labelAsunto: string = 'Asunto:';
  labelDescripcion: string = 'Descripcion:';
  placeholderAsunto: string = 'Escribe tu mensaje aquí...';
  placeholderDescripcion: string = 'Escribe tu mensaje aquí...';
  textoAdjuntar: string = 'Adjuntar archivo';
  textoBotonEnviar: string = 'Enviar';

  // Datos quemados (mock) del PQR actual
  numeroPeticion: string = '132132385';
  usuario: string = 'Harold Arciniegas';
  labelNumeroPeticion: string = 'Numero de Peticion:';
  labelUsuario: string = 'Usuario:';

  // Modelo del formulario
  asunto: string = '';
  descripcion: string = '';
  archivoAdjunto: File | null = null;
  nombreArchivo: string = '';

  volver(): void {
    console.log('Volver al listado');
    // Aquí iría history.back() o router.navigate([...])
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoAdjunto = input.files[0];
      this.nombreArchivo = this.archivoAdjunto.name;
    }
  }

  enviar(): void {
    if (!this.asunto.trim() || !this.descripcion.trim()) {
      console.warn('Asunto y descripción son obligatorios');
      return;
    }

    console.log('Enviando PQR', {
      numeroPeticion: this.numeroPeticion,
      usuario: this.usuario,
      asunto: this.asunto,
      descripcion: this.descripcion,
      archivo: this.nombreArchivo,
    });
  }
}