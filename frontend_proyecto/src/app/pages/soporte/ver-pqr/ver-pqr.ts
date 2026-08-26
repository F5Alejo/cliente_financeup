import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Pqr, PqrService } from '../../../services/pqr';

@Component({
  selector: 'app-ver-pqr',
  imports: [CommonModule],
  templateUrl: './ver-pqr.html',
  styleUrl: './ver-pqr.css',
})
export class VerPqrComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pqrService: PqrService
  ) {}

  // ===== Dato del PQR actual (se carga según el número en la ruta) =====
  pqr: Pqr | null = null;

  // ===== Textos fijos de la interfaz =====
  textoVolver: string = 'Volver a mis PQR';
  badgeTexto: string = 'DETALLE DE SOLICITUD';
  subtitulo: string = 'Aquí puedes ver el estado y los detalles de tu solicitud.';

  labelNumeroPeticion: string = 'Número de petición:';
  labelUsuario: string = 'Usuario:';
  labelAsunto: string = 'Asunto:';
  labelDescripcion: string = 'Descripción:';
  labelEstado: string = 'Estado:';

  textoBotonEnviar: string = 'Enviar un nuevo pqr';

  ngOnInit(): void {
    // La ruta se navega como: this.router.navigate(['/ver-pqr', pqr.numero])
    // (ver pqr.ts -> verPqr()), así que aquí leemos ese mismo parámetro.
    this.route.paramMap.subscribe((params) => {
      const numero = params.get('numero');
      this.pqr = this.pqrService.pqrs.find((p) => p.numero === numero) ?? null;
    });
  }

  /**
   * Devuelve una clase CSS distinta según el estado del PQR,
   * así el color del badge cambia automáticamente.
   */
  obtenerClaseEstado(): string {
    switch (this.pqr?.estado) {
      case 'En revisión':
        return 'estado-amarillo';
      case 'Resuelto':
        return 'estado-verde';
      case 'Rechazado':
        return 'estado-rojo';
      default:
        return 'estado-gris';
    }
  }

  volver(): void {
    this.router.navigate(['/pqr']);
  }

  verArchivo(nombreArchivo: string): void {
    console.log('Ver archivo adjunto:', nombreArchivo);
  }

  enviarNuevoPqr(): void {
    this.router.navigate(['/nuevo-pqr']);
  }
}