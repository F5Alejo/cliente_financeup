# FrontendProyecto

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Pruebas de navegador (Playwright)

Recorridos reales en escritorio y móvil, con revisión de accesibilidad (`@axe-core/playwright`).
Usan el Chrome instalado (`channel: 'chrome'`) y levantan `ng serve` en el puerto 4300.

```bash
npm run e2e            # todas las pruebas, escritorio y móvil
npm run e2e -- --ui    # modo visual para depurar
```

Las pruebas están en `e2e/`. El reporte HTML queda en `playwright-report/` (no se versiona).

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
