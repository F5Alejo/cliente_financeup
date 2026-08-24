# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Responder siempre en español al usuario en este repositorio, sin importar el idioma del mensaje entrante. El código, nombres de variables/métodos y comentarios ya están en español (ver sección "Text/locale" más abajo) — las respuestas conversacionales deben mantener esa misma convención.

## Repository layout

This repo currently contains a single Angular application at `frontend_proyecto/`. All commands below must be run from that directory:

```bash
cd frontend_proyecto
```

## Commands

- `npm start` / `ng serve` — run the dev server at `http://localhost:4200/`
- `ng build` — production build, output to `dist/frontend_proyecto/`
- `ng build --configuration development` — dev build (no optimization, source maps on)
- `ng test` — run unit tests via Vitest (the `@angular/build:unit-test` builder, not Karma)
- `ng generate component pages/<feature>/<name>` — scaffold a new standalone component following existing conventions

There is no lint script configured in `package.json`. Prettier is configured (`.prettierrc`: 100 print width, single quotes, Angular parser for `*.html`) but there is no `format` npm script — invoke it directly if needed: `npx prettier --write .`

## Architecture

**Angular version:** 22, using standalone components exclusively (no NgModules). Some newer components omit `standalone: true` since it's the default in this Angular version — don't add it back when editing them, but don't remove it from components that already declare it either.

**Routing (`src/app/app.routes.ts`):** Uses `withHashLocation()` (hash-based routing, e.g. `/#/finanzas`). All pages are lazy-loaded via `loadComponent()` and nested under a single top-level route with `LayoutComponent` as the shell. The default path (`''`) redirects to `prueba`, and the wildcard (`**`) also redirects to `prueba` — there is no dedicated 404 page. A couple of legacy capitalized paths (`Finanzas`, `Menu`) redirect to their lowercase equivalents for backward compatibility.

**Shell (`src/app/layout/`):** `LayoutComponent` wraps every route with `HeaderComponent`, `RouterOutlet`, and `FooterComponent`. There's also a `SidebarComponent` under `layout/` that is not currently wired into `LayoutComponent` — check whether it's meant to be used before assuming it's dead code.

**Pages (`src/app/pages/`):** One folder per feature area. Note the inconsistent nesting depth — most page folders contain a same-named subfolder (e.g. `pages/login/login/login.ts`), but a few are flat (e.g. `pages/metas/metas.ts`, `pages/inversiones/inversiones.ts`). Match whichever pattern the folder you're editing already uses.

Within `pages/finanzas/` there are two separate, similarly-named menu components — `finanzas-menu/` and `menu/` — with different item lists and neither is referenced from the other. Only `menu` is currently registered in `app.routes.ts` (as path `menu`); `finanzas-menu` is not routed. Confirm which one is intended before modifying either.

**Auth (`src/app/services/auth.ts`):** `AuthService` is a fully mocked, in-memory auth layer — hardcoded `USUARIOS_MOCK` credentials, session persisted to `sessionStorage` under the key `financeup_user`, "remember me" email cached separately in `localStorage` under `financeup_email`. There is no `HttpClient` usage anywhere in the app yet. The TODO comments in that file mark exactly where real backend calls (`POST /api/auth/register`, login endpoint, etc.) are meant to replace the mock logic — do this in place rather than building a parallel real auth path.

**Text/locale:** All UI copy, routes, variable/method names, and comments are in Spanish (e.g. `iniciarSesion`, `obtenerUsuario`, `Registrarse`). Keep new code consistent with this — don't introduce English identifiers or copy into existing Spanish-named files/components.
