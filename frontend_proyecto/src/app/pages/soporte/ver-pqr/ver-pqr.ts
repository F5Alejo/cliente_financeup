import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ver-pqr',
  imports: [CommonModule],
  templateUrl: './ver-pqr.html',
  styleUrl: './ver-pqr.css',
})
export class VerPqrComponent {
  constructor(private readonly router: Router) {}

  // ===== Datos del PQR (quemados) =====
  titulo: string = 'Queja Del Asesor';
  numeroPeticion: string = '132132385';
  usuario: string = 'Harold Arciniegas';

  labelNumeroPeticion: string = 'Numero de Peticion:';
  labelUsuario: string = 'Usuario:';
  labelAsunto: string = 'Asunto:';
  labelDescripcion: string = 'Descripcion:';

  asunto: string = 'Queja del Asesor';
  descripcion: string = 'El asesor no me atudo en nada y fur grosero';

  // ===== Archivos adjuntos (quemados) =====
  archivosAdjuntos: string[] = ['nombre_archivo.jpg', 'nombre_archivo.jpg'];

  // ===== Botón =====
  textoBotonEnviar: string = 'Enviar un nuevo pqr';

  // ===== Estado del PQR =====
  labelEstado: string = 'Estado:';
  estado: string = 'En Revision';

  // ===== Mensaje / respuesta del asesor =====
  mensajeRespuesta: string =
    'estamos revisando tu caso, en caso de algunma novedad, sete notificara por este mismo medio';

  volver(): void {
    console.log('Volver al listado de PQR');
  }

  verArchivo(nombreArchivo: string): void {
    console.log('Ver archivo adjunto:', nombreArchivo);
  }

  enviarNuevoPqr(): void {
    this.router.navigate(['/nuevo-pqr']);
  }
}
