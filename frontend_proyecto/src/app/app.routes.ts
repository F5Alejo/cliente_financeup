import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout/layout';
import { adminGuard } from './pages/admin/admin.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
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
        path: 'alianzas',
        loadComponent: () =>
          import('./pages/alianzas/alianzas/alianzas')
            .then((m) => m.AlianzasComponent),
        title: 'Alianzas - FinanceUp',
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
          import('./pages/soporte/ver-pqr/ver-pqr')
        .then((m) => m.PqrComponent),
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
          import('./pages/finanzas/finanzas/libro-mayor/libro-mayor')
            .then((m) => m.LibroMayorComponent),
        title: 'Libro mayor - FinanceUp',
      },

      {
        path: 'resuelve-deuda',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/finanzas/finanzas/resuelve-deuda/resuelve-deuda')
            .then((m) => m.ResuelveDeudaComponent),
        title: 'Resuelve tu deuda - FinanceUp',
      },

      {
        path: 'admin',
        canActivateChild: [adminGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/admin/dashboard/dashboard').then((m) => m.AdminDashboardComponent),
            title: 'Admin - FinanceUp',
          },
          {
            path: 'alianzas',
            loadComponent: () =>
              import('./pages/admin/alianzas/alianzas').then((m) => m.AdminAlianzasComponent),
            title: 'Admin Alianzas - FinanceUp',
          },
          {
            path: 'educacion',
            loadComponent: () =>
              import('./pages/admin/educacion/educacion').then((m) => m.AdminEducacionComponent),
            title: 'Admin Educación - FinanceUp',
          },
          {
            path: 'finanzas',
            loadComponent: () =>
              import('./pages/admin/finanzas/finanzas').then((m) => m.AdminFinanzasComponent),
            title: 'Admin Finanzas - FinanceUp',
          },
          {
            path: 'inversiones',
            loadComponent: () =>
              import('./pages/admin/inversiones/inversiones')
            .then((m) => m.AdminInversionesComponent),
            title: 'Admin Inversiones - FinanceUp',
          },
          {
            path: 'metas',
            loadComponent: () =>
              import('./pages/admin/metas/metas')
            .then((m) => m.AdminMetasComponent),
            title: 'Admin Metas - FinanceUp',
          },
          {
            path: 'libro-mayor',
            loadComponent: () =>
              import('./admin/libro-mayor/libro-mayor')
            .then((m) => m.AdminLibroMayorComponent),
            title: 'Admin Libro mayor - FinanceUp',
          },
          {
            path: 'resuelve-deuda',
            loadComponent: () =>
              import('./admin/resuelve-deuda/resuelve-deuda')
            .then((m) => m.AdminResuelveDeudaComponent),
            title: 'Admin Resuelve tu deuda - FinanceUp',
          },
          {
            path: 'pqr',
            loadComponent: () =>
              import('./pages/admin/pqr/pqr').then((m) => m.AdminPqrComponent),
            title: 'Admin PQR - FinanceUp',
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