import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout/layout';

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
          import('./pages/register/register').then((m) => m.RegisterComponent),
        title: 'Registro - FinanceUp',
      },

    
      {
  path: 'recuperar-contrasena',
  loadComponent: () =>
    import('./pages/recuperar-contrasena/recuperar-contrasena').then(
      (m) => m.RecuperarContrasena
    ),
  title: 'Recuperar contraseña - FinanceUp',
},

      {
        path: '',
        redirectTo: 'prueba',
        pathMatch: 'full',
      },

      {
        path: 'prueba',
        loadComponent: () =>
          import('./pages/prueba/prueba').then((m) => m.Prueba),
        title: 'Prueba - FinanceUp',
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
        path: 'pqr',
        loadComponent: () =>
          import('./pages/soporte/pqr/pqr').then((m) => m.PqrComponent),
        title: 'Linea de ayuda - FinanceUp',
      },
      {
        path: 'finanzas',
        loadComponent: () =>
          import('./pages/FINANZAS.1/finanzas/finanzas')
            .then((m) => m.FinanzasComponent),
        title: 'Finanzas - FinanceUp',
      },

      {
        path: 'menu',
        loadComponent: () =>
          import('./pages/FINANZAS.1/finanzas-menu/finanzas-menu')
            .then((m) => m.FinanzasMenuComponent),
        title: 'Menu - FinanceUp',
      },
      {
        path: 'inversiones',
        loadComponent: () =>
          import('./pages/FINANZAS.1/inversiones/inversiones')
            .then((m) => m.InversionesComponent),
        title: 'Inversiones - FinanceUp',
      },
      {
        path: 'metas',
        loadComponent: () =>
          import('./pages/FINANZAS.1/metas/metas')
            .then((m) => m.MetasComponent),
        title: 'Metas - FinanceUp',
      },

      {
        path: '**',
        redirectTo: 'prueba',
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