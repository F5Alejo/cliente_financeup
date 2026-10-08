import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { LayoutComponent } from './layout/layout/layout';
import { adminGuard } from './pages/admin/admin.guard';
import { authGuard } from './guards/auth.guard';

// Pantallas de administración que usan el layout nuevo (sidebar + header), además de /admin (dashboard).
// El resto de /admin/* (libro mayor y resuelve tu deuda) sigue con el layout anterior hasta que se migre.
const PANTALLAS_CON_NUEVO_LAYOUT = ['usuarios', 'roles', 'finanzas', 'alianzas', 'educacion', 'inversiones', 'metas', 'pqr', 'reportes', 'notificaciones', 'auditoria', 'configuracion'];

function coincideConNuevoLayoutAdmin(segmentos: UrlSegment[]): UrlMatchResult | null {
  const esAdmin = segmentos[0]?.path === 'admin';
  const esDashboard = segmentos.length === 1;
  return esAdmin && (esDashboard || PANTALLAS_CON_NUEVO_LAYOUT.includes(segmentos[1]?.path))
    ? { consumed: segmentos.slice(0, 1) }
    : null;
}

export const routes: Routes = [
  {
    matcher: coincideConNuevoLayoutAdmin,
    canActivateChild: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/shell/admin-shell').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin/dashboard/dashboard').then((m) => m.AdminDashboardComponent),
        title: 'Dashboard - Administración FinanceUp',
        data: { titulo: 'Dashboard', migas: ['Administración', 'Dashboard'], buscaEn: '/admin/usuarios' },
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./pages/admin/usuarios/usuarios').then((m) => m.AdminUsuariosComponent),
        title: 'Usuarios - Administración FinanceUp',
        data: { titulo: 'Usuarios', migas: ['Administración', 'Usuarios'], buscaEn: '/admin/usuarios' },
      },
      {
        path: 'finanzas',
        loadComponent: () =>
          import('./pages/admin/finanzas/finanzas').then((m) => m.AdminFinanzasComponent),
        title: 'Finanzas - Administración FinanceUp',
        data: { titulo: 'Finanzas', migas: ['Administración', 'Finanzas'], buscaEn: '/admin/finanzas' },
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/admin/roles/roles').then((m) => m.AdminRolesComponent),
        title: 'Roles y permisos - Administración FinanceUp',
        data: { titulo: 'Roles y permisos', migas: ['Administración', 'Roles y permisos'], buscaEn: '/admin/roles' },
      },
      {
        path: 'inversiones',
        loadComponent: () =>
          import('./pages/admin/inversiones/inversiones').then((m) => m.AdminInversionesComponent),
        title: 'Inversiones - Administración FinanceUp',
        data: { titulo: 'Inversiones', migas: ['Administración', 'Inversiones'], buscaEn: '/admin/inversiones' },
      },
      {
        path: 'metas',
        loadComponent: () =>
          import('./pages/admin/metas/metas').then((m) => m.AdminMetasComponent),
        title: 'Metas - Administración FinanceUp',
        data: { titulo: 'Metas', migas: ['Administración', 'Metas'], buscaEn: '/admin/metas' },
      },
      {
        path: 'educacion',
        loadComponent: () =>
          import('./pages/admin/educacion/educacion').then((m) => m.AdminEducacionComponent),
        title: 'Educación - Administración FinanceUp',
        data: { titulo: 'Educación', migas: ['Administración', 'Educación'], buscaEn: '/admin/educacion' },
      },
      {
        path: 'alianzas',
        loadComponent: () =>
          import('./pages/admin/alianzas/alianzas').then((m) => m.AdminAlianzasComponent),
        title: 'Alianzas - Administración FinanceUp',
        data: { titulo: 'Alianzas', migas: ['Administración', 'Alianzas'], buscaEn: '/admin/alianzas' },
      },
      {
        path: 'pqr',
        loadComponent: () =>
          import('./pages/admin/pqr/pqr').then((m) => m.AdminPqrComponent),
        title: 'PQR - Administración FinanceUp',
        data: { titulo: 'PQR / Soporte', migas: ['Administración', 'PQR / Soporte'], buscaEn: '/admin/pqr' },
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./pages/admin/reportes/reportes').then((m) => m.AdminReportesComponent),
        title: 'Reportes - Administración FinanceUp',
        data: { titulo: 'Reportes', migas: ['Administración', 'Reportes'], buscaEn: '/admin/reportes' },
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./pages/admin/notificaciones/notificaciones').then((m) => m.AdminNotificacionesComponent),
        title: 'Notificaciones - Administración FinanceUp',
        data: { titulo: 'Notificaciones', migas: ['Administración', 'Notificaciones'], buscaEn: '/admin/notificaciones' },
      },
      {
        path: 'auditoria',
        loadComponent: () =>
          import('./pages/admin/auditoria/auditoria').then((m) => m.AdminAuditoriaComponent),
        title: 'Auditoría - Administración FinanceUp',
        data: { titulo: 'Auditoría', migas: ['Administración', 'Auditoría'], buscaEn: '/admin/auditoria' },
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./pages/admin/configuracion/configuracion').then((m) => m.AdminConfiguracionComponent),
        title: 'Configuración - Administración FinanceUp',
        data: { titulo: 'Configuración', migas: ['Administración', 'Configuración'], buscaEn: '/admin/configuracion' },
      },
    ],
  },

  {
    path: '',
    component: LayoutComponent,

    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/login/login/login').then((m) => m.LoginComponent),
        title: 'Login - FinanceUp',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/login/register/register').then((m) => m.RegisterComponent),
        title: 'Registro - FinanceUp',
      },

      {
        path: 'recuperar-contrasena',
        loadComponent: () =>
          import('./pages/login/recuperar-contrasena/recuperar-contrasena').then(
            (m) => m.RecuperarContrasena
          ),
        title: 'Recuperar contraseña - FinanceUp',
      },

      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },

      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home').then((m) => m.HomeComponent),
        title: 'Inicio - FinanceUp',
      },

      {
        path: 'perfil',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/perfil/perfil').then((m) => m.PerfilComponent),
        title: 'Mi perfil - FinanceUp',
      },

      {
        path: 'educacion',
        loadComponent: () =>
          import('./pages/educacion/educacion/educacion')
            .then((m) => m.EducacionComponent),
        title: 'Educacion - FinanceUp',
      },

      {
        path: 'educacion/curso/:cursoId',
        loadComponent: () =>
          import('./pages/educacion/curso-detalle/curso-detalle')
            .then((m) => m.CursoDetalleComponent),
        title: 'Curso - FinanceUp',
      },

      {
        path: 'educacion/curso/:cursoId/clase/:leccionId',
        loadComponent: () =>
          import('./pages/educacion/clase/clase').then((m) => m.ClaseComponent),
        title: 'Clase - FinanceUp',
      },

      {
        path: 'educacion/curso/:cursoId/certificado',
        loadComponent: () =>
          import('./pages/educacion/certificado/certificado')
            .then((m) => m.CertificadoComponent),
        title: 'Certificado - FinanceUp',
      },

      {
        path: 'alianzas',
        loadComponent: () =>
          import('./pages/alianzas/alianzas/alianzas')
            .then((m) => m.AlianzasComponent),
        title: 'Alianzas - FinanceUp',
      },

      {
        path: 'alianzas/producto/:productoId',
        loadComponent: () =>
          import('./pages/alianzas/producto-detalle/producto-detalle')
            .then((m) => m.ProductoDetalleComponent),
        title: 'Producto - FinanceUp',
      },

      {
        path: 'alianzas/producto/:productoId/solicitud',
        loadComponent: () =>
          import('./pages/alianzas/solicitud/solicitud')
            .then((m) => m.SolicitudComponent),
        title: 'Solicitud - FinanceUp',
      },

      {
        path: 'centro-ayuda',
        loadComponent: () =>
          import('./pages/soporte/centro-ayuda/centro-ayuda')
            .then((m) => m.CentroAyudaConponent),
        title: 'Centro de ayuda - FinanceUp',
      },

      {
        path: 'linea-ayuda',
        loadComponent: () =>
          import('./pages/soporte/linea-ayuda/linea-ayuda')
            .then((m) => m.LineaAyudaComponent),
        title: 'Linea de ayuda - FinanceUp',
      },
      {
        path: 'habla-con-nosostros',
        loadComponent: () =>
          import('./pages/soporte/habla-con-nosotros/habla-con-nosotros')
            .then((m) => m.HablaConNosotrosComponent),
        title: 'Linea de ayuda - FinanceUp',
      },

      {
        path: 'pqr',
        loadComponent: () =>
          import('./pages/soporte/pqr/pqr').then((m) => m.PqrComponent),
        title: 'Linea de ayuda - FinanceUp',
      },
      {
        path: 'nuevo-pqr',
        loadComponent: () =>
          import('./pages/soporte/nuevo-pqr/nuevo-pqr').then((m) => m.NuevoPqrComponent),
        title: 'Linea de ayuda - FinanceUp',
      },
      {
        path: 'ver-pqr/:numero',
        loadComponent: () =>
          import('./pages/soporte/ver-pqr/ver-pqr').then((m) => m.VerPqrComponent),
        title: 'Detalle PQR - FinanceUp',
      },
      {
        path: 'cookis',
        loadComponent: () =>
          import('./pages/soporte/banner-cookies/banner-cookies').then((m) => m.BannerCookiesComponent),
        title: 'Linea de ayuda - FinanceUp',
      },
      {
        path: 'finanzas',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/finanzas/finanzas/finanzas')
            .then((m) => m.FinanzasComponent),
        title: 'Finanzas - FinanceUp',
      },

      {
        path: 'inversiones',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/finanzas/inversiones/inversiones')
            .then((m) => m.InversionesComponent),
        title: 'Inversiones - FinanceUp',
      },

      {
        path: 'metas',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/finanzas/metas/metas').then((m) => m.MetasComponent),
        title: 'Metas - FinanceUp',
      },

      {
        path: 'menu',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/finanzas/finanzas-menu/finanzas-menu')
            .then((m) => m.FinanzasMenuComponent),
        title: 'Menu - FinanceUp',
      },

      {
        path: 'libro-mayor',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/finanzas/libro-mayor/libro-mayor')
            .then((m) => m.LibroMayorComponent),
        title: 'Libro mayor - FinanceUp',
      },

      {
        path: 'resuelve-deuda',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/finanzas/resuelve-deuda/resuelve-deuda')
            .then((m) => m.ResuelveDeudaComponent),
        title: 'Resuelve tu deuda - FinanceUp',
      },

      {
        path: 'herramientas',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/finanzas/herramientas/herramientas')
            .then((m) => m.HerramientasComponent),
        title: 'Herramientas - FinanceUp',
      },

      {
        path: 'admin',
        canActivateChild: [adminGuard],
        children: [
          {
            path: 'libro-mayor',
            loadComponent: () =>
              import('./pages/admin/libro-mayor/libro-mayor')
            .then((m) => m.AdminLibroMayorComponent),
            title: 'Admin Libro mayor - FinanceUp',
          },
          {
            path: 'resuelve-deuda',
            loadComponent: () =>
              import('./pages/admin/resuelve-deuda/resuelve-deuda')
            .then((m) => m.AdminResuelveDeudaComponent),
            title: 'Admin Resuelve tu deuda - FinanceUp',
          },
        ],
      },

      {
        path: '**',
        redirectTo: 'home',
      },
    ],
  },

  {
    path: 'Finanzas',
    redirectTo: 'finanzas',
    pathMatch: 'full',
  },
  {
    path: 'Menu',
    redirectTo: 'menu',
    pathMatch: 'full',
  },
];
