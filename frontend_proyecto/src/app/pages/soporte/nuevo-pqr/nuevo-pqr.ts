import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PqrService, PrioridadPqr, TipoPqr } from '../../../services/pqr';
import { mensajeDeError } from '../../../services/api';
import { ToastService } from '../../../shared/services/toast';
import { AuthService } from '../../../services/auth';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';

const RUTA_LOGIN = '/login';

@Component({
  selector: 'app-nuevo-pqr',
  imports: [FormsModule, BandaSeccionComponent, IconComponent],
  templateUrl: './nuevo-pqr.html',
  styleUrl: './nuevo-pqr.css',
})
export class NuevoPqrComponent {
  constructor(
    private pqrService: PqrService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router
  ) {}

  // Textos de la interfaz
  subtitulo: string =
    'Entre más detalles nos des (fechas, producto, qué esperabas), más rápido resolvemos tu caso.';
  labelTipo: string = 'Tipo de solicitud:';
  labelCategoria: string = 'Categoría:';
  labelPrioridad: string = 'Prioridad:';
  labelAsunto: string = 'Asunto:';
  labelDescripcion: string = 'Descripción:';
  placeholderAsunto: string = 'Resume tu solicitud en una frase';
  placeholderDescripcion: string = 'Describe con detalle lo que ocurrió...';
  textoAdjuntar: string = 'Adjuntar archivo';
  textoAdjuntarAyuda: string = 'PDF, JPG o PNG hasta 5 MB. Guardamos el nombre del archivo para el asesor.';
  textoBotonEnviar: string = 'Enviar PQR';

  // Mientras el MID guarda la PQR se bloquea el botón para no radicarla dos veces
  enviando = signal(false);

  get usuario(): string {
    return this.authService.obtenerNombre();
  }

  // Opciones del formulario
  readonly tipos: TipoPqr[] = ['Petición', 'Queja', 'Reclamo', 'Sugerencia'];
  readonly categorias = [
    'Atención al cliente',
    'Movimientos y pagos',
    'Plataforma',
    'Alianzas y beneficios',
  ];
  readonly prioridades: PrioridadPqr[] = ['Alta', 'Media', 'Baja'];

  // Pasos informativos del proceso
  readonly pasos = [
    { titulo: 'Radicas', detalle: 'Envías tu solicitud' },
    { titulo: 'Revisamos', detalle: 'Un asesor toma el caso' },
    { titulo: 'Respondemos', detalle: 'Máximo 48 horas hábiles' },
  ];

  // Modelo del formulario
  tipo: TipoPqr = 'Petición';
  categoria: string = 'Atención al cliente';
  prioridad: PrioridadPqr = 'Media';
  asunto: string = '';
  descripcion: string = '';
  archivoAdjunto: File | null = null;
  nombreArchivo: string = '';

  /** Los errores se muestran solo después del primer intento de enviar. */
  intentoEnviar = signal(false);

  get errorAsunto(): string {
    if (!this.intentoEnviar() || this.asunto.trim()) return '';
    return 'Escribe el asunto en una frase, por ejemplo «Cobro repetido en mi cuenta».';
  }

  get errorDescripcion(): string {
    if (!this.intentoEnviar()) return '';
    if (!this.descripcion.trim()) return 'Cuéntanos qué pasó: cuándo, con qué producto y qué esperabas.';
    if (this.descripcion.trim().length < 20) return 'Agrega un poco más de detalle (mínimo 20 caracteres).';
    return '';
  }

  get caracteresRestantes(): number {
    return 600 - this.descripcion.length;
  }

  volver(): void {
    this.router.navigate(['/pqr']);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    if (archivo.size > 5 * 1024 * 1024) {
      this.toastService.error('El archivo pesa más de 5 MB.');
      input.value = '';
      return;
    }
    this.archivoAdjunto = archivo;
    this.nombreArchivo = archivo.name;
  }

  enviar(): void {
    if (!this.authService.estaAutenticado()) {
      this.toastService.info('Inicia sesión para radicar una nueva PQR.');
      this.router.navigate([RUTA_LOGIN]);
      return;
    }

    this.intentoEnviar.set(true);
    if (this.errorAsunto || this.errorDescripcion) {
      // El foco va al primer campo con error para que se lea el mensaje.
      document.getElementById(this.errorAsunto ? 'asunto' : 'descripcion')?.focus();
      return;
    }

    this.enviando.set(true);
    this.pqrService
      .radicarPqr({
        titulo: this.asunto.trim(),
        tipo: this.tipo,
        categoria: this.categoria,
        prioridad: this.prioridad,
        descripcion: this.descripcion.trim(),
        adjunto: this.archivoAdjunto,
      })
      .subscribe({
        next: (pqr) => {
          this.enviando.set(false);
          this.toastService.success(`PQR radicada con el número ${pqr.radicado}.`);
          this.router.navigate(['/ver-pqr', pqr.radicado]);
        },
        error: (error) => {
          this.enviando.set(false);
          this.toastService.error(mensajeDeError(error));
        },
      });
  }
}
