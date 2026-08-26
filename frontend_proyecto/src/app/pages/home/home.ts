import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

interface Feature {
  icono: 'dashboard' | 'seguridad' | 'bancos' | 'presupuesto' | 'monedas' | 'mundo';
  titulo: string;
  descripcion: string;
}

interface ServicioItem {
  texto: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  // ===== Hero =====
  heroTituloPre: string = 'Gestiona tus';
  heroTituloDestacado: string = 'Finanzas';
  heroTituloPost: string = 'con Inteligencia';
  heroSubtitulo: string =
    'Plataforma integral para el control financiero personal y empresarial. Toma decisiones inteligentes con datos en tiempo real.';
  heroBoton: string = 'Comenzar Ahora';

  // ===== Características =====
  featuresTituloPre: string = 'Características';
  featuresTituloDestacado: string = 'Poderosas';
  featuresSubtitulo: string =
    'Todo lo que necesitas para tomar el control total de tus finanzas personales y empresariales.';

  features: Feature[] = [
    {
      icono: 'dashboard',
      titulo: 'Dashboard Intuitivo',
      descripcion:
        'Visualiza todas tus finanzas en un solo lugar con gráficos interactivos y reportes en tiempo real.',
    },
    {
      icono: 'seguridad',
      titulo: 'Seguridad Bancaria',
      descripcion:
        'Encriptación de nivel bancario y autenticación de dos factores para proteger tu información financiera.',
    },
    {
      icono: 'bancos',
      titulo: 'Conecta con Bancos',
      descripcion:
        'Encuentra una variedad de bancos en donde te podrás contactar directamente con los asesores de estos.',
    },
    {
      icono: 'presupuesto',
      titulo: 'Gestión de Presupuestos',
      descripcion:
        'Crea y monitorea presupuestos personalizados con alertas automáticas de gastos y ahorro.',
    },
    {
      icono: 'monedas',
      titulo: 'Múltiples Monedas',
      descripcion:
        'Soporte para más de 150 monedas con conversión automática y tasas actualizadas al instante.',
    },
    {
      icono: 'mundo',
      titulo: 'En todo el mundo',
      descripcion: 'Ingresa desde cualquier parte del mundo desde nuestra página web.',
    },
  ];

  // ===== Servicios =====
  serviciosTituloPre: string = 'Nuestros';
  serviciosTituloDestacado: string = 'Servicios';
  serviciosSubtitulo: string =
    'Soluciones financieras adaptadas a cada necesidad, desde usuarios individuales hasta grandes empresas.';

  finanzasPersonalesTitulo: string = 'Finanzas Personales';
  finanzasPersonalesDescripcion: string =
    'Controla tus ingresos, gastos y ahorros con herramientas diseñadas para individuos y familias. Obtén una visión clara de tu salud financiera.';
  finanzasPersonalesItems: ServicioItem[] = [
    { texto: 'Seguimiento automático de gastos' },
    { texto: 'Establecimiento de metas de ahorro' },
    { texto: 'Reportes mensuales detallados' },
  ];
  finanzasPersonalesBoton: string = 'Conocer Más';

  gestionEmpresarialTitulo: string = 'Gestión Empresarial';
  gestionEmpresarialDescripcion: string =
    'Conecta con cualquier banco en cualquier parte del mundo a través de nosotros, tendrás acceso a:';
  gestionEmpresarialItems: ServicioItem[] = [
    { texto: 'Comunicación con los bancos' },
    { texto: 'Control de finanzas' },
    { texto: 'Análisis de rentabilidad' },
  ];
  gestionEmpresarialBoton: string = 'Conocer Más';

  // ===== CTA final =====
  ctaTitulo: string = 'Comienza a Gestionar tus Finanzas Hoy';
  ctaSubtitulo: string =
    'Únete a más de 50,000 usuarios que ya están tomando el control de su futuro financiero con nuestra plataforma inteligente.';
  ctaBotonPrimario: string = 'Crear Cuenta Gratis';
  ctaBotonSecundario: string = 'Conocer mas';

  // ===== Acciones =====

  /** Botón "Comenzar Ahora" del hero: lleva a Mis PQR si hay sesión, o al login si no. */
  onComenzarAhora(): void {
    this.router.navigate([this.authService.estaAutenticado() ? '/pqr' : '/login']);
  }

  onConocerFinanzasPersonales(): void {
    console.log('Conocer más: Finanzas Personales');
  }

  onConocerGestionEmpresarial(): void {
    console.log('Conocer más: Gestión Empresarial');
  }

  /** Botón "Crear Cuenta Gratis" del CTA final: manda a registro. */
  onCrearCuenta(): void {
    this.router.navigate(['/registro']);
  }

  onConocerMasCta(): void {
    console.log('Conocer más (CTA final)');
  }
}