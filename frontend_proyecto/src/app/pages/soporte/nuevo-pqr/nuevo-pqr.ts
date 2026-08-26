import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PqrService, PrioridadPqr } from '../../../services/pqr';
import { ToastService } from '../../../shared/services/toast';
import { AuthService } from '../../../services/auth';

// TODO: ajustar esta ruta si tu página de login no está en '/login'.
const RUTA_LOGIN = '/login';

@Component({
  selector: 'app-nuevo-pqr',
  imports: [FormsModule],
  templateUrl: './nuevo-pqr.html',
  styleUrl: './nuevo-pqr.css',
})
export class NuevoPqrComponent implements OnInit {
  constructor(
    private pqrService: PqrService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si alguien entra directo por URL sin sesión, lo mandamos al login.
    if (!this.authService.estaAutenticado()) {
      this.toastService.info('Inicia sesión para radicar una nueva PQR.');
      this.router.navigate([RUTA_LOGIN]);
    }
  }

  // Textos de la interfaz
  titulo: string = 'Nuevo PQR';
  subtitulo: string =
    'Cuéntanos qué pasó. Entre más detalles nos des, más rápido resolvemos tu caso.';
  labelTipo: string = 'Tipo de solicitud:';
  labelCategoria: string = 'Categoría:';
  labelPrioridad: string = 'Prioridad:';
  labelAsunto: string = 'Asunto:';
  labelDescripcion: string = 'Descripción:';
  placeholderAsunto: string = 'Resume tu solicitud en una frase';
  placeholderDescripcion: string = 'Describe con detalle lo que ocurrió...';
  textoAdjuntar: string = 'Adjuntar archivo';
  textoAdjuntarAyuda: string = 'PDF, JPG o PNG hasta 5 MB';
  textoBotonEnviar: string = 'Enviar PQR';

  labelNumeroPeticion: string = 'Número de petición:';
  labelUsuario: string = 'Usuario:';

  // Número de petición mock (se genera real al enviar); el usuario ya no
  // está quemado, se toma de la sesión activa.
  numeroPeticion: string = '132132385';

  get usuario(): string {
    return this.authService.obtenerNombre();
  }

  // Opciones del formulario
  readonly tipos = ['Petición', 'Queja', 'Reclamo'];
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
  tipo: string = 'Petición';
  categoria: string = 'Atención al cliente';
  prioridad: PrioridadPqr = 'Media';
  asunto: string = '';
  descripcion: string = '';
  archivoAdjunto: File | null = null;
  nombreArchivo: string = '';

  get caracteresRestantes(): number {
    return 600 - this.descripcion.length;
  }

  volver(): void {
    this.router.navigate(['/pqr']);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoAdjunto = input.files[0];
      this.nombreArchivo = this.archivoAdjunto.name;
    }
  }

  enviar(): void {
    if (!this.authService.estaAutenticado()) {
      this.toastService.info('Inicia sesión para radicar una nueva PQR.');
      this.router.navigate([RUTA_LOGIN]);
      return;
    }

    if (!this.asunto.trim() || !this.descripcion.trim()) {
      this.toastService.info('El asunto y la descripción son obligatorios.');
      return;
    }

    this.pqrService.agregarPqr({
      titulo: this.asunto.trim(),
      numero: Math.floor(1000000 + Math.random() * 9000000).toString(),
      estado: 'Radicado',
      tipo: this.tipo,
      categoria: this.categoria,
      descripcion: this.descripcion.trim(),
      prioridad: this.prioridad,
      fechaCreacion: new Date().toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      ultimaActualizacion: 'Hace un momento',
      asesor: 'Por asignar',
      respuestas: 0,
      adjuntos: this.nombreArchivo ? 1 : 0,
      progreso: 10,
      usuario: this.usuario,
      archivosAdjuntos: this.nombreArchivo ? [this.nombreArchivo] : [],
      mensajeRespuesta: 'Tu solicitud fue radicada. Un asesor la revisará pronto.',
    });

    this.toastService.success('PQR radicada correctamente.');
    this.router.navigate(['/pqr']);
  }
}