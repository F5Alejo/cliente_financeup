# Guía de estudio — FinanceUp (Módulo Finanzas)

Esta guía explica, con tus propias palabras del código, qué hace cada archivo, cada función, cada card y cada sección del módulo de Finanzas (el que más construimos juntos). Al final de cada bloque hay **preguntas de práctica** con la respuesta ya resuelta, para que las repases en voz alta como si te las preguntara el instructor.

> Consejo para el sustentado: no memorices el código de memoria. Entiende el **porqué** de cada pieza (qué problema resuelve) y podrás explicar cualquier función con tus propias palabras, aunque te cambien el orden de las preguntas.

---

## 0. Qué cambió recientemente en Finanzas (el rediseño completo)

Si el instructor pregunta "¿qué hiciste tú, específicamente, en este módulo?", esta es la lista — en orden, con el porqué de cada decisión.

### 0.1 Los movimientos ya no viven duplicados — ahora hay una sola fuente de verdad
**Antes:** Finanzas tenía su propio arreglo de movimientos (con un campo `monto` que podía ser negativo) y Libro Mayor tenía **otro** arreglo distinto (con `tipo`/`valor` separados). No se comunicaban entre sí: agregar un movimiento en Libro Mayor no aparecía en Finanzas, y viceversa — dos "verdades" distintas del mismo dinero.

**Ahora:** `services/finanzas.ts` (`FinanzasService`) es la única fuente de datos. `FinanzasComponent`, `LibroMayorComponent` y `AdminFinanzasComponent` inyectan el mismo service y leen/escriben sobre el mismo arreglo:

```typescript
export interface Movimiento {
  id: number;
  fecha: string;         // 'YYYY-MM-DD'
  concepto: string;
  categoria: string;
  tipo: 'ingreso' | 'gasto';
  valor: number;          // siempre positivo; el signo lo da `tipo`, no el número
  metodoPago?: string;
  observaciones?: string;
}
```

El service también centraliza la asignación de `id` con un contador privado (`siguienteId`): ningún componente inventa su propio id, todos mandan los datos sin id (`Omit<Movimiento, 'id'>`) y el service se los asigna al agregar.

**Pregunta típica:** *"¿Cómo se actualiza Finanzas si agrego un movimiento desde Libro Mayor, sin recargar la página?"*
**Respuesta:** Porque ambos componentes inyectan la **misma instancia** de `FinanzasService` (es un singleton, `providedIn: 'root'`). `LibroMayorComponent.guardarMovimiento()` llama `finanzasService.agregarMovimiento(...)`, que hace `push` sobre el arreglo `movimientos` dentro del service. `FinanzasComponent` lee ese mismo arreglo a través de un getter privado (`todosLosMovimientos`), así que en el siguiente ciclo de detección de cambios de Angular, sus getters (`tarjetas`, `salud`, `distribucion`, etc.) se recalculan con el dato nuevo.

### 0.2 Finanzas dejó de ser un CRUD y se convirtió en un "hub" de resumen
**Antes:** Finanzas tenía su propio mini-CRUD de Activos/Pasivos/Gastos y un botón "Ver todos" que expandía la tabla localmente — duplicaba funcionalidad que ya existía (o debía existir) en otros módulos.

**Ahora:** Finanzas es única y exclusivamente un resumen que **redirige** a cada módulo real, no administra nada por sí sola:
- Las 4 tarjetas (Ingreso, Gastos, Disponible, Ahorro) tienen cada una una `ruta` y un botón "Ver detalle →" — las 3 primeras van a Libro Mayor, "Ahorro" va a Metas (porque el ahorro se relaciona con las metas, no con un movimiento suelto).
- La tabla de "Movimientos recientes" ya no tiene un toggle local: siempre muestra los 5 más recientes (`.slice(0, 5)`) y el botón "Ver todos" manda a Libro Mayor, que es donde en verdad se administran.
- El panel de metas tiene "Ver todas →" hacia `/metas`; la franja de salud financiera tiene "Ver detalle →" hacia `/libro-mayor`; las gráficas (dona de gastos, línea de inversión) enlazan a Libro Mayor e Inversiones.

```typescript
interface TarjetaResumen {
  icono: string; titulo: string; valor: string; tendencia: string;
  ruta: string;   // <- a dónde redirige el botón "Ver detalle →" de esta tarjeta
}
```

### 0.3 Activos y Pasivos se movieron a Herramientas, como una calculadora de "Patrimonio"
El bloque "Activos, Pasivos y Gastos" de Finanzas se partió en dos: **Gastos se eliminó por completo** (esa información ya vive en los movimientos con `tipo: 'gasto'`, no tenía sentido duplicarla en otro lado) y **Activos/Pasivos se movieron** a Herramientas como una 4ª calculadora, "Patrimonio" (ver sección 9.1).

### 0.4 El admin de Finanzas se actualizó para no romperse
Como `Movimiento` cambió de forma (el viejo tenía `icono`/`monto`; el nuevo tiene `tipo`/`valor`/`categoria`), `pages/admin/finanzas/` también tuvo que reescribirse para usar el modelo nuevo — si no, habría dejado de compilar. Esto no se pidió directamente, pero era necesario: al ser un service **compartido**, un cambio en su forma afecta a todo el que lo use, incluido un módulo que no se estaba tocando a propósito.

### 0.5 Paleta de colores nueva, solo en los submódulos de Finanzas
Cada submódulo de Finanzas ahora define su propia paleta de colores como variables CSS locales (no un tema global). Es un tema aparte de la lógica de negocio, pero tiene una trampa de Angular interesante — está explicado a fondo en la **sección 12**, al final de esta guía.

---

## 1. Fundamentos que se repiten en TODO el proyecto

Antes de módulo por módulo, estos 6 conceptos aparecen una y otra vez. Si los dominas, entiendes el 80% del código.

### 1.1 Componentes "standalone"
Angular moderno (v17+) ya no obliga a usar `NgModule`. Cada componente declara sus propias dependencias directamente en el decorador:

```typescript
@Component({
  selector: 'app-metas',
  imports: [FormsModule, FinanzasMenuComponent, CursoBannerComponent], // lo que este componente necesita
  templateUrl: './metas.html',
  styleUrl: './metas.css',
})
export class MetasComponent { ... }
```

`imports` es la lista de "herramientas" que el HTML de ese componente va a usar: si usas `[(ngModel)]` necesitas `FormsModule`; si usas `<app-curso-banner>` necesitas importar `CursoBannerComponent`, etc.

### 1.2 `signal()` — una caja que Angular vigila
Un signal guarda un valor y avisa a Angular cuando cambia, para que Angular vuelva a dibujar solo la parte del HTML que depende de ese valor (no toda la página).

- **Leerlo**: se llama como función → `terminoBusqueda()`
- **Cambiarlo por completo**: `.set(nuevoValor)` → `mostrarBusqueda.set(false)`
- **Cambiarlo a partir del valor anterior**: `.update(fn)` → `ordenAscendente.update(v => !v)`

Ejemplo real (`finanzas.ts`):
```typescript
mostrarBusqueda = signal(false);
alternarBusqueda(): void {
  this.mostrarBusqueda.update((v) => !v);   // true -> false, false -> true
}
```

### 1.3 `get algo()` (getter) vs `computed()`
Ambos "calculan" un valor a partir de otros, pero son distintos:

- **`get` normal** (el más usado en este proyecto): es una propiedad calculada de TypeScript puro. Angular la vuelve a ejecutar **cada vez que revisa el componente** (cada ciclo de detección de cambios), no solo cuando cambian sus datos. Ejemplo: `get tarjetas()` en `finanzas.ts` sí recalcula ingresos/gastos leyendo `finanzasService.movimientos` en vivo.
- **`computed()`**: es un signal derivado. Angular lo cachea y **solo** lo recalcula cuando alguno de los signals que usa adentro cambia. Se usa en `resuelve-deuda.ts` (`saldoTotal = computed(() => ...)`) y en `educacion.ts`.

**Pregunta típica de instructor:** *"¿Por qué en Resuelve tu deuda usaron `computed()` y no un `get` normal?"*
**Respuesta:** Porque las deudas están guardadas en un `signal<DeudaRegistrada[]>`, y `computed()` se integra mejor con signals: se recalcula automáticamente solo cuando `deudas` cambia, sin que Angular tenga que "adivinar" revisándolo en cada ciclo.

### 1.4 Los *services* son la única fuente de verdad
Cada dato importante (metas, inversiones, movimientos, solicitudes de deuda) vive en un **service** (`@Injectable({ providedIn: 'root' })`), no dentro del componente. Esto es clave: como el service es un singleton (una sola instancia compartida en toda la app), **el usuario y el admin leen exactamente los mismos datos**.

```typescript
@Injectable({ providedIn: 'root' })
export class MetasService {
  metas: Meta[] = [ ... ];          // el dato vive aquí, no en el componente
  agregarMeta(datos: NuevaMeta) { ... }
  editarMeta(id: number, cambios: Partial<Meta>) { ... }
  eliminarMeta(id: number) { ... }
}
```

Cualquier componente que necesite metas simplemente **inyecta** el service en su constructor:
```typescript
constructor(private metasService: MetasService) {}
get metas() { return this.metasService.metas; }
```

**Pregunta típica:** *"Si el usuario crea una meta nueva, ¿por qué el admin la ve sin recargar la página?"*
**Respuesta:** Porque ambos inyectan la misma instancia de `MetasService` (es un singleton). El usuario llama `metasService.agregarMeta(...)`, que modifica el arreglo `metas` dentro del service; como el admin lee ese mismo arreglo (`metasService.metas`), en el siguiente ciclo de detección de cambios Angular repinta la tabla con el dato nuevo.

### 1.5 Sintaxis de control de flujo `@if` / `@for`
Es la sintaxis moderna de Angular (reemplaza a `*ngIf` / `*ngFor`, aunque `header.html` todavía usa `*ngFor` — verás las dos):

```html
@if (mostrarBusqueda()) {
  <section class="barra-busqueda"> ... </section>
}

@for (t of tarjetas; track t.titulo) {
  <div class="card-resumen"> ... </div>
}
```

`track` le dice a Angular **cómo identificar cada elemento** entre un repintado y otro (por id, por nombre, etc.), para que no vuelva a crear todos los elementos del DOM cada vez.

### 1.6 Rutas y guards (`app.routes.ts` / `auth.guard.ts`)
Cada URL de la app está mapeada a un componente en `app.routes.ts`, usando **lazy loading** (`loadComponent`, se carga el componente solo cuando el usuario entra a esa ruta, no todo de una vez):

```typescript
{
  path: 'metas',
  canActivate: [authGuard],   // <- exige sesión iniciada
  loadComponent: () => import('./pages/finanzas/metas/metas').then((m) => m.MetasComponent),
}
```

`authGuard` es una función que Angular ejecuta **antes** de entrar a la ruta:
```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.estaAutenticado()) return true;   // deja pasar
  router.navigateByUrl('/login');                    // si no, lo manda a login
  return false;
};
```

**Pregunta típica:** *"¿Qué pasa si alguien escribe `/metas` directamente en la URL sin haber iniciado sesión?"*
**Respuesta:** `authGuard` se ejecuta antes de cargar `MetasComponent`, ve que `estaAutenticado()` es `false`, redirige a `/login` con `router.navigateByUrl(...)` y devuelve `false`, así que la ruta `/metas` nunca llega a renderizarse.

---

## 2. Login y autenticación

**Archivos:** `services/auth.ts`, `guards/auth.guard.ts`, `pages/login/login/login.ts` + `.html`

### `AuthService` (services/auth.ts)
Simula un backend real usando un arreglo en memoria (`USUARIOS_MOCK`) y `sessionStorage` para recordar la sesión entre recargas de página.

| Método | Qué hace |
|---|---|
| `validarCredenciales(email, password)` | Busca en `usuarios` un match exacto de correo+clave. Devuelve el `Usuario` o `null`. **No** inicia sesión todavía. |
| `completarSesion(usuario)` | Guarda el usuario como sesión activa (`sessionStorage.setItem`). Se llama **después** de que el 2FA es correcto. |
| `iniciarSesionConProveedor(proveedor)` | Simula login social (Google/Apple/Facebook) con un `setTimeout` de 1.2s, como si fuera una llamada real a un servidor. |
| `registrarUsuario(...)` | Crea un usuario nuevo si el correo no existe. |
| `estaAutenticado()` | `true`/`false` según si hay sesión activa. Lo usa `authGuard`. |
| `cerrarSesion()` | Borra la sesión de memoria y de `sessionStorage`. |

### `LoginComponent` — login en dos etapas
El campo `stage: 'credenciales' | 'verificacion'` decide qué parte del HTML se muestra (con `@if (stage === 'credenciales')` / `@if (stage === 'verificacion')`).

1. **Etapa credenciales**: el formulario llama `login()`. Si `validarCredenciales()` devuelve `null`, se muestra `errorMessage`. Si es válido, se guarda el usuario en `usuarioValidado` (todavía sin iniciar sesión) y se cambia a `stage = 'verificacion'`.
2. **Etapa verificación (2FA simulado)**: `verificarCodigo()` compara lo escrito contra un código quemado (`CODIGO_2FA_MOCK = '123456'`). Si coincide, llama `completarSesion(usuarioValidado)` y navega a `/home`.

**Preguntas de práctica**

1. *"¿Por qué `login()` no inicia sesión de una vez, si las credenciales ya son correctas?"*
   Porque el flujo simula autenticación de dos factores: primero se valida usuario/clave (`validarCredenciales`) y se guarda el usuario **temporalmente** en `usuarioValidado`; la sesión solo se confirma (`completarSesion`) cuando el código de verificación también es correcto. Separar los dos pasos permite mostrar la pantalla de "verifica tu identidad" sin haber dejado ya al usuario adentro.

2. *"¿Cómo cambiarías el código para que el 2FA expirara después de 60 segundos?"*
   Guardaría un `Date.now()` al entrar a `stage = 'verificacion'`, y en `verificarCodigo()` comprobaría si ya pasó más de 60000 ms antes de comparar el código; si expiró, mostraría un mensaje y regresaría a `stage = 'credenciales'` (reutilizando `volverACredenciales()`).

3. *"¿Qué pasa si el usuario cierra la pestaña en la etapa de verificación y vuelve a entrar?"*
   Como `completarSesion()` nunca se llamó, no hay nada en `sessionStorage`; al volver a `/login`, `stage` arranca de nuevo en `'credenciales'` (es el valor por defecto de la propiedad), así que tiene que iniciar todo el proceso otra vez.

---

## 3. Layout general (lo que envuelve cada página)

**Archivos:** `layout/layout/layout.ts`, `layout/header/header.ts` + `.html`, `pages/finanzas/finanzas-menu/finanzas-menu.ts` + `.html`

- **`LayoutComponent`**: es el "molde" de toda la app. Combina `<app-header>`, `<router-outlet>` (donde se inyecta la página actual según la ruta) y `<app-footer>`, además de `<app-toast-container>` (las notificaciones flotantes tipo "Meta creada correctamente").
- **`HeaderComponent`**: la barra de navegación superior. Su lista `navItems` incluye la propiedad `requiereSesion`; el getter `navItemsVisibles` filtra esa lista para no mostrar "Finanzas" si nadie ha iniciado sesión:
  ```typescript
  get navItemsVisibles(): NavItem[] {
    const autenticado = this.authService.estaAutenticado();
    return this.navItems.filter((item) => !item.requiereSesion || autenticado);
  }
  ```
  También controla el menú desplegable del perfil (`menuAbierto`, `toggleMenu()`, `cerrarSesion()`).
- **`FinanzasMenuComponent`**: el submenú fijo que ves arriba en Finanzas, Metas, Inversiones, etc. (`<app-finanzas-menu>`). Es solo una lista `items: SubMenuItem[]` pintada con `@for` y `routerLinkActive="activo"` para resaltar en qué submódulo estás.

**Pregunta típica:** *"¿Por qué 'Finanzas' desaparece del menú si cierro sesión, pero 'Educación' e 'Inicio' no?"*
**Respuesta:** Porque solo el ítem de Finanzas tiene `requiereSesion: true` en el arreglo `navItems`; el getter `navItemsVisibles` filtra usando ese campo y `authService.estaAutenticado()`. Los demás ítems no tienen esa marca, así que siempre se muestran.

---

## 4. Finanzas (el dashboard principal — hoy es un "hub" de resumen)

**Archivos:** `pages/finanzas/finanzas/finanzas.ts` + `.html`, `services/finanzas.ts`

> Recordatorio del rediseño (sección 0.2): esta pantalla **no administra nada**. Solo lee datos reales de los services compartidos, los resume, y cada pieza tiene un botón que te manda al módulo donde ese dato realmente se edita.

### El service (`FinanzasService`)
Guarda `movimientos: Movimiento[]` — ver la interfaz completa en la sección 0.1. Los métodos son `agregarMovimiento`, `agregarMovimientos` (plural, para importar varios de una vez desde Excel), `editarMovimiento`, `eliminarMovimiento`, e `iconoPorCategoria(categoria)` (mapea una categoría a un emoji, para no tener que guardar un ícono en cada movimiento).

### Cards y secciones, de arriba hacia abajo

**Encabezado (`finanzas-header`)** — saludo con `usuario` (cargado en `ngOnInit()` desde `authService.obtenerNombre()`) y dos botones de acción:
- 🔍 **Lupa**: `(click)="alternarBusqueda()"` — abre/cierra la barra de búsqueda.
- 🔔 **Campana**: un `<a [routerLink]="['/educacion']" [queryParams]="{ escuela: escuelaRecomendada }">` — lleva a Educación con la escuela recomendada ya seleccionada.

**Barra de búsqueda (`barra-busqueda`)** — solo aparece si `mostrarBusqueda()` es `true`. El input usa binding manual (no `[(ngModel)]` directo) para poder escribir en un signal:
```html
[ngModel]="terminoBusqueda()"
(ngModelChange)="terminoBusqueda.set($event)"
```
El getter `resultadosBusqueda` junta 4 fuentes distintas y las filtra por el texto escrito. Los resultados de tipo "Movimiento" ahora redirigen a `/libro-mayor` (antes se editaban ahí mismo en Finanzas):
```typescript
get resultadosBusqueda(): ResultadoBusqueda[] {
  const termino = this.terminoBusqueda().trim().toLowerCase();
  if (!termino) return [];
  const secciones = this.secciones.filter(...);                    // menú fijo (Finanzas, Metas, etc.)
  const metas = this.metasService.metas.filter(...).map(...);            // metas por nombre, ruta: '/metas'
  const inversiones = this.inversionesService.inversiones.filter(...).map(...); // ruta: '/inversiones'
  const movimientos = this.todosLosMovimientos.filter(...).slice(0,5).map(...); // ruta: '/libro-mayor'
  return [...secciones, ...metas, ...inversiones, ...movimientos];
}
```
Cada resultado tiene una `ruta`, así que al hacer clic navega ahí y cierra la búsqueda (`(click)="alternarBusqueda()"`).

**Franja de salud financiera (`salud-financiera`)** — el getter `salud` decide un estado con reglas simples en cascada:
```typescript
get salud() {
  const disponible = this.totalIngresos - this.totalGastos;
  const ahorroPct = ...;
  if (disponible < 0) return { estado: 'Alto riesgo', mensaje: '...' };
  if (ahorroPct < 10) return { estado: 'Atención', mensaje: '...' };
  return { estado: 'En orden', mensaje: '...' };
}
```
El HTML usa `[class.salud-riesgo]="salud.estado === 'Alto riesgo'"` para pintar la franja de rojo/ámbar/verde, y un `<a class="link-salud" routerLink="/libro-mayor">Ver detalle →</a>` al lado, porque el "detalle" de esa salud son los movimientos.

**Tarjetas resumen (`cards-resumen`)** — 4 cards (Ingreso, Gastos, Disponible, Ahorro) generadas por el getter `tarjetas`, que depende de `totalIngresos` / `totalGastos` (dos getters privados que filtran `movimientos` por `tipo` y suman `valor` con `reduce`). Cada tarjeta ahora trae su propia `ruta` de redirección:
```typescript
get tarjetas(): TarjetaResumen[] {
  const disponible = this.totalIngresos - this.totalGastos;
  const ahorroPct = this.totalIngresos > 0 ? Math.round((disponible / this.totalIngresos) * 100) : 0;
  return [
    { icono: '💰', titulo: 'Ingreso',     valor: ..., tendencia: ..., ruta: '/libro-mayor' },
    { icono: '💼', titulo: 'Gastos',      valor: ..., tendencia: ..., ruta: '/libro-mayor' },
    { icono: '🏦', titulo: 'Disponible',  valor: ..., tendencia: ..., ruta: '/libro-mayor' },
    { icono: '🐷', titulo: 'Ahorro',      valor: `${ahorroPct}%`, tendencia: 'De tus ingresos', ruta: '/metas' },
  ];
}
```
El HTML pinta el botón con `<a class="card-boton" [routerLink]="t.ruta">Ver detalle →</a>` — usa el `routerLink` **dinámico** (con corchetes y el valor del objeto), no una ruta quemada, porque cada tarjeta va a un sitio distinto.

**Gráficas (`graficas`)** — dos paneles, cada uno con su propio enlace de salida:
- *Distribución del salario* → dona hecha con **CSS puro** (`conic-gradient`, no una librería de gráficas). El getter `distribucion` agrupa los gastos por categoría con un `Map`, `gradienteDistribucion` arma el string del gradiente cónico, y el panel enlaza a `/libro-mayor`.
- *Crecimiento inversión* → línea SVG. El getter `puntosLinea` convierte los valores en coordenadas `x,y` dentro de un `viewBox="0 0 320 90"` (ver la explicación detallada más abajo), y el panel enlaza a `/inversiones`.

**Tabla de movimientos recientes** — ya no tiene el toggle "ver todos" de antes. El getter `movimientos` simplemente muestra los 5 más recientes de siempre:
```typescript
get movimientos(): Movimiento[] {
  return this.todosLosMovimientos.slice(0, 5);
}
```
El encabezado de la sección trae el botón `<a class="link-boton" routerLink="/libro-mayor">Ver todos en Libro Mayor →</a>` — para ver o editar el resto, hay que ir al módulo real.

**Tus metas (`metas-panel`)** — igual que en Metas.ts, pero solo muestra `metasService.metas.slice(0, 4)` como vista previa (mismo patrón que las 5 filas de movimientos), con anillos SVG (`stroke-dasharray`/`stroke-dashoffset` calculados por `obtenerOffset(porcentaje)`, ver la explicación detallada más abajo) y un botón "Ver todas →" hacia `/metas`.

**Banner de curso** — al final, `<app-curso-banner texto="..." cursoId="presupuesto-50-30-20">`.

> **Lo que ya NO existe aquí:** el bloque "Activos, Pasivos y Gastos" (`registros-panel`) se eliminó por completo de este componente — ver secciones 0.3 y 9.1 para saber a dónde se movió cada pieza.

### Explicando a fondo dos funciones que parecen "raras": `puntosLinea` y `obtenerOffset`

Estas dos son casi seguro las que más preguntas generan, porque no son lógica de negocio (sumar plata) sino **matemática de dibujo** (convertir números en coordenadas SVG). Vale la pena entenderlas bien porque se repiten, casi idénticas, en Inversiones y Herramientas.

**`puntosLinea` (la línea de crecimiento SVG):**
```typescript
get puntosLinea(): string {
  const datos = this.crecimiento;
  const max = Math.max(...datos.map(d => d.valor));
  const min = Math.min(...datos.map(d => d.valor));
  const ancho = 320;
  const alto = 90;
  return datos.map((d, i) => {
    const x = (i / (datos.length - 1)) * ancho;
    const y = alto - ((d.valor - min) / (max - min || 1)) * alto;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}
```
Un `<polyline>` de SVG no entiende "6 meses con estos valores" — solo entiende pares `x,y` en un plano, tipo `"0,90 64,75 128,60 ..."`. Esta función traduce los datos reales a esas coordenadas:
- **`x`** reparte los puntos en línea recta a lo ancho del dibujo: el primer dato va en `x = 0`, el último en `x = 320` (el `ancho` del `viewBox`), y los del medio proporcionalmente entre esos dos, según su posición `i` en el arreglo.
- **`y`** es la parte que más confunde: en SVG el eje Y crece hacia **abajo** (0 arriba, 90 abajo — al revés de un plano cartesiano normal). Por eso la fórmula arranca en `alto` (90, o sea abajo del todo) y le **resta** la proporción de qué tan alto es ese valor comparado con el rango min-máx. Así, el valor más alto (`max`) termina con un `y` chico (arriba en el dibujo) y el más bajo (`min`) con un `y` grande (abajo).
- `(max - min || 1)` evita dividir por cero si todos los valores fueran iguales.
- `.join(' ')` pega todos los pares `"x,y"` separados por espacio, el formato que espera el atributo `points` del `<polyline>`.

**`obtenerOffset(porcentaje)` (el anillo de progreso de cada meta):**
```typescript
radioAnillo = 30;
circunferencia = 2 * Math.PI * this.radioAnillo;

obtenerOffset(porcentaje: number): number {
  return this.circunferencia * (1 - porcentaje / 100);
}
```
Un círculo en SVG se "llena" con un truco: se dibuja el trazo completo (`stroke-dasharray = circunferencia`, el perímetro entero del círculo) y luego se usa `stroke-dashoffset` para decirle **desde dónde empezar a dibujar** ese trazo. Si el offset es igual a toda la circunferencia, no hay nada visible (0% de avance); si el offset es 0, se ve el círculo completo (100%). Por eso la fórmula es `circunferencia × (1 − porcentaje/100)`: en 0% el offset es la circunferencia completa (nada visible), en 100% el offset es 0 (círculo completo), y en 60% deja visible exactamente el 60% del anillo.

### Preguntas de práctica — Finanzas

1. *"¿Por qué `escuelaRecomendada` a veces recomienda 'inversión' y a veces 'finanzas-personales'?"*
   ```typescript
   get escuelaRecomendada(): string {
     const actividadInversion = this.inversionesService.inversiones.length;
     const actividadPersonal = this.todosLosMovimientos.length + this.metasService.metas.length;
     return actividadInversion > actividadPersonal ? 'inversion' : 'finanzas-personales';
   }
   ```
   Compara cuántas inversiones tiene el usuario contra la suma de sus movimientos + metas. Si tiene más actividad en inversiones, asume que le interesa más ese tema y lo manda a esa escuela; si no, a finanzas personales. Es una heurística simple a propósito (contar registros), no un algoritmo de recomendación complejo.

2. *"¿Por qué se sacó el CRUD de Activos/Pasivos/Gastos de Finanzas si ya funcionaba?"*
   Porque violaba el principio de "una sola fuente de verdad, un solo lugar para editar cada cosa": Finanzas ya no debía tener su propio mini-CRUD local (`registros: Record<...>` viviendo dentro del componente, sin service) mientras Libro Mayor administraba movimientos por su cuenta con OTRO arreglo. Ahora Finanzas es puramente un resumen de lectura, y cada dato se edita en un solo sitio: movimientos en Libro Mayor, patrimonio (activos/pasivos) en Herramientas.

3. *"¿Qué pasa si `totalIngresos` es 0 y trato de calcular `ahorroPct`?"*
   El código lo cubre explícitamente: `const ahorroPct = this.totalIngresos > 0 ? Math.round((disponible/this.totalIngresos)*100) : 0;` — si no hay ingresos, el porcentaje es `0` en vez de dividir por cero (que en JavaScript daría `NaN` o `Infinity`, no un error, pero rompería visualmente la tarjeta).

4. *"¿Por qué la barra de búsqueda usa `[ngModel]` + `(ngModelChange)` en vez de `[(ngModel)]`?"*
   Porque `[(ngModel)]` (two-way binding) necesita una variable normal que se pueda escribir directamente, y `terminoBusqueda` es un **signal**, no una variable simple — no se puede hacer `terminoBusqueda = 'x'`, hay que usar `.set('x')`. Separando el binding en dos partes (`[ngModel]` para leer, `(ngModelChange)` para escribir con `.set($event)`), se puede conectar un input de formulario con un signal.

5. *"¿Por qué el botón de cada tarjeta usa `[routerLink]="t.ruta"` (con corchetes) y no `routerLink="/libro-mayor"` directo?"*
   Porque las 4 tarjetas no van todas al mismo sitio: 3 van a `/libro-mayor` y 1 (Ahorro) va a `/metas`. `[routerLink]` con corchetes le dice a Angular "evalúa esto como una expresión de TypeScript" (en este caso, lee `t.ruta` del objeto de esa tarjeta), mientras que `routerLink="/libro-mayor"` sin corchetes sería un texto fijo, igual para las 4 tarjetas — no serviría si cada una necesita ir a un lugar distinto.

6. *"¿Por qué `y` en `puntosLinea` empieza en `alto` y resta, en vez de empezar en 0 y sumar?"*
   Porque el sistema de coordenadas de SVG tiene el `0` de Y arriba del todo y crece hacia abajo (al revés de una gráfica de matemáticas normal). Si el código hiciera `y = ((valor - min) / (max - min)) * alto` sin restarlo de `alto`, la gráfica saldría **invertida**: los valores más altos aparecerían abajo y los más bajos arriba. Restar de `alto` "voltea" el resultado para que se vea como uno esperaría ver una gráfica de crecimiento.

---

## 5. Libro Mayor

**Archivos:** `pages/finanzas/libro-mayor/libro-mayor.ts` + `.html` (el componente más grande del proyecto: filtros, orden, CRUD completo, exportar e **importar** desde Excel).

### Los datos ya no viven aquí — viven en `FinanzasService`
Antes, Libro Mayor tenía su propio arreglo `Movimiento[]` local, separado del que usaba Finanzas. Ahora **no guarda ningún dato propio**: inyecta `FinanzasService` (el mismo que usa `FinanzasComponent` y el admin) y todo lo que este componente hace es leer y escribir a través de él:
```typescript
constructor(private finanzasService: FinanzasService) {}

get movimientos(): Movimiento[] {
  return this.finanzasService.movimientos;   // solo una "ventana" de lectura hacia el service
}
```
`guardarMovimiento()` no empuja directo sobre `this.movimientos` — llama `finanzasService.editarMovimiento(id, cambios)` o `finanzasService.agregarMovimiento(datos)` según si `modoEdicion()` está activo. `confirmarEliminar()` llama `finanzasService.eliminarMovimiento(id)`. La interfaz `Movimiento` (`id`, `fecha`, `concepto`, `categoria`, `tipo`, `valor`, y los opcionales `metodoPago`/`observaciones` — estos últimos opcionales porque los movimientos importados de Excel no los traen) se importa desde `services/finanzas.ts`, no se declara aquí.

**Filtros y orden** — cinco signals independientes (`textoBusqueda`, `categoriaFiltro`, `tipoFiltro`, `fechaDesde`, `fechaHasta`) se combinan en el getter `movimientosFiltrados`. El orden de la tabla usa el mismo patrón "mayor control" que verás repetido en los admin: `columnaOrden` + `direccionOrden`, y `ordenarPor(columna)` invierte la dirección si ya estabas ordenando por esa misma columna.

**CRUD manual**: `abrirFormularioNuevo()` / `abrirFormularioEditar(movimiento)` preparan el formulario; `guardarMovimiento()` decide si crea o edita según si hay un id en edición; `pedirConfirmacionEliminar()` → `confirmarEliminar()` / `cancelarEliminar()` son un patrón de confirmación en dos pasos (en vez del `confirm()` nativo del navegador que usan otros módulos, aquí hay una mini-modal propia).

**Exportar (`exportar()`)**: igual que en Inversiones, arma un Excel con SheetJS (`XLSX.utils.json_to_sheet` → `book_new` → `book_append_sheet` → `writeFile`).

**Importar desde Excel** (lo más particular de este módulo):
1. `abrirImportador()` muestra el panel de importación.
2. `onArchivoSeleccionado(event)` lee el archivo `.xlsx` que el usuario sube.
3. `validarImportacion()` revisa fila por fila: si falta un dato obligatorio o el formato no es válido, lo agrega a `erroresImportacion: ErrorImportacion[]` (con el número de fila y el motivo) **en vez de** rechazar todo el archivo.
4. `confirmarImportacion()` llama `finanzasService.agregarMovimientos(resultado.validos)` (nota el **plural**: es un método aparte de `agregarMovimiento`, pensado justo para insertar varios de una vez sin llamar al service fila por fila) — el service les asigna id a todos y los agrega de un tirón.

**Pregunta típica:** *"¿Por qué separan `validarImportacion()` de `confirmarImportacion()` en vez de importar todo de una vez al leer el archivo?"*
**Respuesta:** Para que el usuario pueda **ver** qué filas tienen error antes de que se agreguen datos incorrectos a su libro mayor. Validar primero permite mostrarle la lista de errores (fila + motivo) y solo confirmar la importación de las filas válidas cuando el usuario decide continuar — evita que un typo en una fila arruine silenciosamente todo el archivo.

**Pregunta típica:** *"¿Por qué existen `agregarMovimiento` y `agregarMovimientos` como dos métodos separados en el service, si uno podría llamar al otro en un loop?"*
**Respuesta:** Sí se podría lograr lo mismo llamando `agregarMovimiento` dentro de un `for`, pero `agregarMovimientos` hace **un solo** `push(...nuevos)` sobre el arreglo en vez de uno por cada fila importada — con un Excel de cientos de filas, evita disparar de más el ciclo de detección de cambios de Angular innecesariamente. Es una optimización pequeña, pero también dice explícitamente en el código "esto es para importaciones masivas", que es más claro de leer que un loop suelto en el componente.

*Nota:* `pages/admin/libro-mayor/libro-mayor.ts` sigue el mismo patrón de "mayor control" que ya viste en Inversiones/Metas/Resuelve tu deuda admin (búsqueda + filtro + columnas ordenables), aplicado sobre los mismos movimientos — y el panel de administrador de Finanzas (`pages/admin/finanzas/`) es otro consumidor más del mismo `FinanzasService`: si editas un movimiento ahí, también cambia en Libro Mayor y en el dashboard de Finanzas, por la misma razón de siempre (un solo service, una sola fuente de verdad). Vale la pena que abras esos dos archivos y los compares tú mismo contra el de usuario — es el mejor ejercicio de repaso.

---

## 6. Inversiones (usuario + admin)

**Archivos:** `pages/finanzas/inversiones/inversiones.ts` + `.html`, `pages/admin/inversiones/inversiones.ts` + `.html`, `services/inversiones.ts`

### El service
`balanceInversiones`, `rendimientoTotal`, etc. como números fijos ya **no se usan** para las cards — se dejaron en el service como referencia histórica, pero el componente los recalcula desde `inversiones: Inversion[]` real, para que agregar/editar/eliminar una inversión sí mueva las cifras.

### Lado usuario
- **Cards superiores**: `balanceInversiones` y `rendimientoTotal` ahora son getters que **suman** el arreglo real:
  ```typescript
  get balanceInversiones(): number {
    return this.inversionesService.inversiones.reduce((s, i) => s + i.monto, 0);
  }
  ```
- **`alertaConcentracion`**: getter que avisa si ≥50% del dinero está en riesgo "Alto" — un ejemplo de "detectar el problema del usuario antes de que lo tenga": si alguien concentra todo en riesgo alto, se le sugiere diversificar.
- **Dona de carteras**: igual patrón que en Finanzas (conic-gradient calculado con `gradienteCarteras`).
- **Tabla con filtros** (`filtroActivo`: Todos / Corto plazo / Largo plazo / Mejores) vía `seleccionarFiltro()`.
- **`exportar()`**: genera el `.xlsx` con SheetJS.
- **Formulario nueva inversión**: `guardarNuevaInversion()`.

  ⚠️ **Detalle importante para el sustentado** (esto es justo el tipo de cosa que un instructor pregunta para ver si entendiste bien):
  ```typescript
  get inversiones(): Inversion[] {
    const todas = this.inversionesService.inversiones;
    switch (this.filtroActivo()) {
      case 'Corto plazo': return todas.filter(...);   // arreglo NUEVO (copia filtrada)
      case 'Mejores': return [...todas].sort(...);     // arreglo NUEVO (copia ordenada)
      default: return todas;                            // el MISMO arreglo del service
    }
  }
  guardarNuevaInversion(): void {
    ...
    this.inversiones.push({ ... });   // empuja directo sobre el getter `inversiones`
  }
  ```
  Como `guardarNuevaInversion()` hace `this.inversiones.push(...)`, y `inversiones` es un **getter**, el resultado depende de qué filtro esté activo en ese momento: si `filtroActivo()` es `'Todos'`, el getter devuelve la referencia real del arreglo del service, así que el `push` sí queda guardado. Pero si el usuario tiene activo el filtro "Corto plazo" o "Mejores" cuando agrega la inversión, el getter devuelve una **copia nueva** (`filter`/`sort` crean arreglos nuevos), y el `push` se pierde en cuanto Angular vuelve a llamar al getter — la inversión nunca llega al service.

  **Pregunta de práctica:** *"¿Cómo arreglarías ese bug?"*
  **Respuesta:** Cambiar `guardarNuevaInversion()` para que llame al método del service en vez de empujar sobre el getter: `this.inversionesService.agregarInversion({ id: this.siguienteIdInversion++, nombre, monto, rendimiento: 0, riesgo: this.riesgoNuevaInversion, duracion: ... })`. Así siempre se guarda en el arreglo real del service, sin importar qué filtro esté activo — es exactamente el mismo patrón que ya usa el admin (`inversionesService.agregarInversion(...)`).

### Lado admin (`AdminInversionesComponent`)
Este es el patrón de **"mayor control e interactividad"** que se repite en Metas admin y Resuelve tu deuda admin — vale la pena aprendérselo una vez y reconocerlo en los otros dos:

```typescript
busqueda = signal('');                                  // 1. buscar por texto
riesgoFiltro = signal<'Todos'|'Bajo'|'Medio'|'Alto'>('Todos'); // 2. filtrar por categoría
columnaOrden = signal<'nombre'|'monto'|...|null>(null);  // 3. click en encabezado = ordenar
ordenAscendente = signal(true);

get inversionesFiltradas(): Inversion[] {
  let lista = this.inversionesService.inversiones;
  if (termino) lista = lista.filter(...);
  if (this.riesgoFiltro() !== 'Todos') lista = lista.filter(...);
  if (columna) lista = [...lista].sort((a, b) => {
    const comparacion = typeof valA === 'number' ? valA - valB : String(valA).localeCompare(String(valB));
    return this.ordenAscendente() ? comparacion : -comparacion;
  });
  return lista;
}
```

`ordenarPor(columna)` es el mismo "toggle": si ya estabas ordenando por esa columna, invierte; si no, empieza ascendente en la columna nueva.

El formulario de edición reutiliza un solo `formInversion` para crear **y** editar: `editarInversion(inv)` copia los datos ahí (`{ ...inversion }`, un *spread* para no editar el objeto original por accidente) y guarda el id en `editandoId`; `guardarInversion()` mira si `editandoId` tiene valor para decidir si llama `editarInversion()` o `agregarInversion()` del service.

### Preguntas de práctica — Inversiones

1. *"¿Por qué se usa `{ ...inversion }` en vez de `formInversion = inversion` directamente?"*
   Porque `{ ...inversion }` crea una **copia** del objeto (spread operator). Si hicieras `formInversion = inversion`, ambas variables apuntarían al mismo objeto en memoria, y cualquier cambio en el formulario (antes de guardar) modificaría también la fila de la tabla en tiempo real — incluso si el usuario cancela la edición.

2. *"¿Cómo agregarías una columna 'Rendimiento %' ordenable en el admin?"*
   Agregaría `'rendimientoPorcentaje'` al tipo de `columnaOrden`, y como no es un campo directo del objeto `Inversion` sino calculado (`rendimientoPorcentaje(inv)`), tendría que ajustar el `sort` para usar esa función en vez de `a[columna]` cuando la columna sea esa — o, más simple, guardar el porcentaje calculado en una propiedad temporal antes de ordenar.

3. *"¿Qué hace exactamente `typeof valA === 'number' ? valA - valB : String(valA).localeCompare(...)`?"*
   Decide cómo comparar según el tipo de dato: si es número, resta directa (`valA - valB`, negativo si A va antes); si es texto (como `nombre` o `riesgo`), usa `localeCompare` que compara alfabéticamente respetando tildes y mayúsculas del español.

---

## 7. Metas (usuario + admin)

**Archivos:** `pages/finanzas/metas/metas.ts` + `.html`, `pages/admin/metas/metas.ts` + `.html`, `services/metas.ts`

### El service
```typescript
interface Meta { id, nombre, icono, porcentaje, actual, objetivo, cumplida }
agregarMeta(datos)   // calcula porcentaje = actual/objetivo, redondeado y topado a 100
editarMeta(id, cambios)  // si cambia `actual` u `objetivo`, RECALCULA porcentaje y cumplida
eliminarMeta(id)
```
Fíjate que `editarMeta` no confía en que quien lo llama mande el porcentaje correcto — lo recalcula él mismo cada vez que `actual` u `objetivo` cambian. Esto evita inconsistencias (por ejemplo, que alguien abone dinero y el porcentaje visual no se actualice).

### Lado usuario
- **Ordenar por avance**: `ordenAscendente` signal + `masOpciones()` (el botón 🔼/🔽 del header) — el getter `metas` ordena una **copia** (`[...this.metasService.metas].sort(...)`) para no alterar el orden original del service.
- **Abonar dinero** (funcionalidad nueva de esta sesión): `metaAbonando` guarda el id de la meta que tiene el mini-formulario abierto (o `null` si ninguna). `confirmarAbono(meta)` valida el monto y llama:
  ```typescript
  this.metasService.editarMeta(meta.id, { actual: meta.actual + this.montoAbono });
  ```
  — es decir, no calcula el nuevo porcentaje aquí; delega en `editarMeta` del service, que ya sabe recalcularlo.
- **`notaSecundaria(meta)`**: mensaje dinámico — "¡Felicidades!" si ya está cumplida, "¡Ya casi lo logras! Faltan $X" si el avance es ≥90%, o solo "Faltan $X" en cualquier otro caso.
- **Formulario nueva meta**: `guardarNuevaMeta()` valida nombre y objetivo > 0 antes de llamar `metasService.agregarMeta(...)`.

### Lado admin
Mismo patrón "mayor control" que Inversiones admin, pero con `estadoFiltro: 'Todas'|'Cumplidas'|'En progreso'` en vez de riesgo, y una función propia `faltante(meta)` que calcula cuánto le falta con un mínimo de 0 (`Math.max(0, objetivo - actual)`, para que nunca se muestre un "falta" negativo si alguien sobrepasó el objetivo).

### Preguntas de práctica — Metas

1. *"¿Qué pasa si abono más dinero del que falta para completar la meta?"*
   `editarMeta` calcula `porcentaje = Math.min(100, Math.round((actual/objetivo)*100))` — el `Math.min(100, ...)` evita que el porcentaje pase de 100%, aunque `actual` termine siendo mayor que `objetivo`. Y `cumplida = actual >= objetivo` queda en `true`.

2. *"¿Por qué el getter `metas` hace `[...this.metasService.metas].sort(...)` y no `this.metasService.metas.sort(...)` directo?"*
   Porque `.sort()` en JavaScript **ordena el arreglo original in-place** (lo modifica), no devuelve uno nuevo. Si se hiciera sobre `metasService.metas` directamente, se estaría reordenando el arreglo real del service cada vez que este getter se ejecuta — lo cual además afectaría a cualquier otro componente (como Finanzas o el admin) que también use esos mismos datos. El spread `[...]` crea una copia primero, así que solo se ordena la copia.

3. *"¿Cómo agregarías una barra de progreso general que sume el ahorro de TODAS las metas, no solo las visibles?"*
   Ya existe: `progresoGeneral` usa `totalAhorrado / totalObjetivo` sobre `this.metas` (que en este componente ya son todas, solo cambia el orden, no la cantidad). Si quisiera un progreso que ignore el orden/filtro, leería directo de `this.metasService.metas` en vez de `this.metas`.

---

## 8. Resuelve tu deuda (usuario + admin)

**Archivos:** `pages/finanzas/resuelve-deuda/resuelve-deuda.ts` + `.html`, `pages/admin/resuelve-deuda/resuelve-deuda.ts` + `.html`, `services/resuelve-deuda.ts`

Este es el módulo con la fórmula financiera más "seria" del proyecto: la de **amortización a cuota fija** (la misma que usa cualquier banco para calcular una cuota mensual).

### El service — conecta usuario y admin
```typescript
solicitudes = signal<SolicitudConsolidacion[]>([...]);
crearSolicitud(datos)   // agrega una solicitud nueva con estado 'Pendiente'
cambiarEstado(id, estado)  // el admin la mueve a 'Aprobada' o 'Rechazada'
```
Antes de esta sesión, el usuario y el admin tenían **listas separadas** que no se comunicaban (un bug real: el usuario "solicitaba" algo que nunca llegaba a ningún lado). Ahora ambos leen y escriben el mismo `signal`.

### Lado usuario
- **Registrar deudas**: `deudas` es un `signal<DeudaRegistrada[]>`. `agregarDeuda()` valida los 4 campos y hace `.update(actual => [...actual, nuevaDeuda])` — importante: no hace `.push()` directo sobre `deudas()`, sino que crea un arreglo nuevo con spread, porque así es como se actualiza un signal correctamente (inmutabilidad).
- **Los tres `computed()`**:
  ```typescript
  saldoTotal = computed(() => this.deudas().reduce((s, d) => s + d.saldo, 0));
  cuotaActualTotal = computed(() => this.deudas().reduce((s, d) => s + d.cuotaActual, 0));
  cuotaEstimadaNueva = computed(() => {
    const saldo = this.saldoTotal();
    const iMensual = this.tasaPropuesta / 100 / 12;   // tasa anual -> mensual
    const n = this.plazoReferenciaMeses;               // 24 meses de referencia
    if (saldo === 0) return 0;
    return (saldo * iMensual) / (1 - Math.pow(1 + iMensual, -n));
  });
  ahorroMensualEstimado = computed(() => this.cuotaActualTotal() - this.cuotaEstimadaNueva());
  ```
  La fórmula `(saldo × i) / (1 − (1+i)^−n)` es la fórmula estándar de cuota fija (sistema francés de amortización): cuánto tendrías que pagar cada mes para pagar `saldo` en `n` meses a una tasa mensual `i`.
- **`miSolicitud`**: getter que busca, entre todas las solicitudes del service, la **última** que pertenece a este usuario (`propias[propias.length - 1]`) — así sabe si mostrar el banner de estado (Pendiente/Aprobada/Rechazada) y si debe deshabilitar el botón de solicitar de nuevo.
- **`solicitarConsolidacion()`**: no deja solicitar si no hay deudas registradas, ni si ya hay una solicitud en estado "Pendiente" (evita duplicados).

### Lado admin
`pendientes`, `saldoTotalPendiente` y `ahorroTotalOfrecido` son `computed()` sobre el signal del service. `cambiarEstado(id, estado)` es el botón de Aprobar/Rechazar — ojo al comentario que dejamos en el código:
```typescript
cambiarEstado(id: number, estado: EstadoSolicitud): void {
  this.resuelveDeudaService.cambiarEstado(id, estado);
  // Punto de extensión: aquí se dispararía la negociación real con el banco
  // (o el rechazo formal), no solo el cambio de estado en la tabla.
  this.toastService.success(...);
}
```

### Preguntas de práctica — Resuelve tu deuda

1. *"¿Por qué `agregarDeuda()` usa `.update(actual => [...actual, nuevaDeuda])` en vez de `deudas().push(nuevaDeuda)`?"*
   Porque los signals deben tratarse como **inmutables**: Angular detecta el cambio comparando si la referencia del valor cambió. Si hicieras `.push()` sobre el arreglo que devuelve `deudas()`, estarías mutando el arreglo existente sin crear uno nuevo — la referencia seguiría siendo la misma, y en algunos casos Angular no se enteraría de que hay que repintar.

2. *"Si cambio `plazoReferenciaMeses` de 24 a 36, ¿qué otros valores cambian automáticamente?"*
   `cuotaEstimadaNueva` (porque usa `this.plazoReferenciaMeses` en su fórmula) y, en cadena, `ahorroMensualEstimado` (porque depende de `cuotaEstimadaNueva`) — gracias a que ambos son `computed()`, Angular resuelve esa cadena de dependencias solo.

3. *"¿Por qué `miSolicitud` compara por `s.usuario === this.usuario` (nombre) y no por un id de usuario?"*
   Es una simplificación del mock: como no hay backend real ni un `id` de usuario único todavía, se usa el nombre que devuelve `authService.obtenerNombre()` como identificador. En una versión con backend real, se cambiaría por el id único del usuario autenticado, para evitar que dos usuarios con el mismo nombre se mezclen.

---

## 9. Herramientas (calculadoras financieras)

**Archivo:** `pages/finanzas/herramientas/herramientas.ts` + `.html`

Cuatro calculadoras controladas por un solo signal `herramientaActiva: IdHerramienta`, que decide cuál `@if` se muestra. Cada una tiene su propia fórmula:

| Calculadora | Fórmula | Getter principal |
|---|---|---|
| Interés simple | `Interés = Capital × Tasa × (Tiempo/12)` | `interesSimpleCalculado` |
| Interés compuesto | `Monto = Capital × (1 + tasa/n)^(n×años)` | `montoCompuesto` |
| Fondo fiduciario | Capital inicial compuesto + aportes mensuales compuestos (valor futuro de una anualidad) | `proyeccionFiduciaria` |
| Patrimonio | `Patrimonio neto = Activos − Pasivos` | `patrimonioNeto` |

### 9.1 Patrimonio (Activos y Pasivos) — la calculadora nueva, movida desde Finanzas
Esta es la que antes vivía en Finanzas como el bloque "Activos, Pasivos y Gastos" (sección 0.3). Es la única de las 4 que no calcula con una fórmula financiera "seria" — es un mini-registro con dos pestañas:

```typescript
type TipoPatrimonio = 'activos' | 'pasivos';
interface RegistroPatrimonio { id: number; nombre: string; monto: number; }

tipoPatrimonio = signal<TipoPatrimonio>('activos');   // qué pestaña está activa
private siguienteIdPatrimonio = 1000;

registrosPatrimonio: Record<TipoPatrimonio, RegistroPatrimonio[]> = {
  activos: [ ... ],
  pasivos: [ ... ],
};

get listaActivaPatrimonio(): RegistroPatrimonio[] {
  return this.registrosPatrimonio[this.tipoPatrimonio()];
}

totalPorTipoPatrimonio(tipo: TipoPatrimonio): number {
  return this.registrosPatrimonio[tipo].reduce((suma, r) => suma + r.monto, 0);
}

get patrimonioNeto(): number {
  return this.totalActivosPatrimonio - this.totalPasivosPatrimonio;
}
```
`agregarRegistroPatrimonio()` valida nombre + monto > 0 (el mismo patrón de siempre) y usa su **propio** contador de id (`siguienteIdPatrimonio`, arrancando en 1000) — no comparte contador con `FinanzasService`, porque este registro es independiente de los movimientos: un "Activo" (como un carro o ahorros en cuenta) no es un ingreso ni un gasto, es algo que ya tienes o que debes.

**Pregunta típica:** *"¿Por qué Patrimonio guarda sus datos directo en el componente (`registrosPatrimonio`) en vez de usar un service, si ya viste que Finanzas y Libro Mayor comparten `FinanzasService`?"*
**Respuesta:** Porque, a diferencia de los movimientos (que sí necesitan que Finanzas, Libro Mayor y el admin vean el mismo dato), el patrimonio hoy solo se usa **en este componente**. No hay una pantalla admin ni otro submódulo que necesite leer activos/pasivos todavía — así que crear un service ahora sería complejidad de más ("YAGNI": *you aren't gonna need it*). Si en el futuro se necesitara mostrar el patrimonio neto en, por ejemplo, el dashboard de Finanzas, ahí sí valdría la pena sacarlo a un `PatrimonioService`, siguiendo el mismo patrón que ya existe para movimientos, metas e inversiones.

El diccionario `definiciones: Record<IdHerramienta, string>` guarda una explicación corta de cada concepto (lo que pediste: "definición directa y concisa"), y se muestra arriba de cada calculadora con `{{ definiciones['interes-simple'] }}`.

**La gráfica comparativa** (simple vs. compuesto) reutiliza el mismo capital y tasa que la calculadora de interés compuesto, para que se vea, visualmente, por qué el compuesto termina ganando más:
```typescript
get valoresSimpleGrafica(): number[] {
  return this.aniosGrafica.map((anio) => capital + capital * tasa * anio);      // línea recta
}
get valoresCompuestoGrafica(): number[] {
  return this.aniosGrafica.map((anio) => capital * Math.pow(1 + tasa, anio));   // línea curva
}
```
`aPuntosSvg()` es un método privado compartido que convierte cualquiera de las dos series en coordenadas SVG, usando el **mismo máximo** (`Math.max(...valoresSimpleGrafica, ...valoresCompuestoGrafica)`) para que ambas líneas compartan la misma escala vertical y se puedan comparar de un vistazo.

### Preguntas de práctica — Herramientas

1. *"¿Por qué el fondo fiduciario separa el cálculo en 'capitalCrecido' y 'aportesCrecidos'?"*
   Porque son dos fenómenos distintos: el capital inicial crece solo, componiendo mes a mes (`capital × (1+r)^meses`); los aportes mensuales, en cambio, van entrando en momentos distintos, así que cada uno tiene menos tiempo para crecer que el anterior — por eso se usa la fórmula de "valor futuro de una anualidad" para sumarlos todos correctamente, en vez de simplemente multiplicar el aporte por los meses.

2. *"¿Qué pasa si la tasa fiduciaria es 0%?"*
   El código lo contempla explícitamente: `rMensual === 0 ? aporteMensual × meses : fórmula con rMensual` — si la tasa es 0, la fórmula de anualidad tendría una división por cero (`/ rMensual`), así que se usa la suma simple de los aportes en su lugar.

3. *"¿Cómo agregarías una quinta calculadora, por ejemplo 'Valor futuro de una meta'?"*
   Agregaría `'valor-futuro'` al tipo `IdHerramienta`, un objeto nuevo en el arreglo `herramientas` (icono, nombre, descripción), su definición en `definiciones`, las propiedades de entrada (`capitalX`, `tasaX`, etc.), un getter con la fórmula, y un bloque `@if (herramientaActiva() === 'valor-futuro') { ... }` en el HTML con su propio formulario — exactamente el mismo patrón que ya siguió Patrimonio al agregarse como 4ª calculadora.

4. *"¿Qué pasa si elimino un activo y era el único activo registrado?"*
   `listaActivaPatrimonio` devuelve un arreglo vacío `[]` (el `.filter()` de `eliminarRegistroPatrimonio` no deja nada), y `totalPorTipoPatrimonio('activos')` con un arreglo vacío hace `[].reduce((suma, r) => suma + r.monto, 0)` — el `reduce` sobre un arreglo vacío simplemente devuelve el valor inicial (`0`), no un error. Así que `totalActivosPatrimonio` queda en `0` y `patrimonioNeto` se vuelve negativo si aún quedan pasivos — lo cual es matemáticamente correcto (si no tienes nada y debes algo, tu patrimonio neto es negativo).

---

## 10. Curso Banner + integración con Educación

**Archivos:** `shared/components/curso-banner/curso-banner.ts` + `.html`, `services/educacion.ts` (catálogo), `pages/educacion/educacion/educacion.ts`

### `CursoBannerComponent`
Es un componente reutilizable con dos `@Input()`: `texto` (la frase gancho) y `cursoId` (el id de un curso real del catálogo). Su único getter busca el curso real:
```typescript
get curso() {
  return this.educacionService.buscarCurso(this.cursoId);
}
```
El HTML solo se dibuja si `curso` existe (`@if (curso) { ... }`), así que si algún día se borra un curso del catálogo, el banner simplemente desaparece en vez de mostrar un enlace roto.

**Por qué se hizo así en vez de escribir el banner 6 veces:** cada submódulo (Finanzas, Metas, Inversiones, Libro Mayor, Resuelve tu deuda) solo necesita una línea:
```html
<app-curso-banner texto="..." cursoId="presupuesto-50-30-20"></app-curso-banner>
```
Si mañana quieres cambiar el diseño del banner, lo cambias en **un solo archivo** (`curso-banner.html`/`.css`) y se actualiza en los 5 submódulos a la vez — esa es la ventaja central de hacer un componente reutilizable en vez de copiar y pegar HTML.

### Conexión con la campana 🔔 (`EducacionComponent`)
```typescript
ngOnInit(): void {
  const escuela = this.route.snapshot.queryParamMap.get('escuela');
  if (escuela) this.escuelaActiva.set(escuela);
}
```
`route.snapshot.queryParamMap.get('escuela')` lee el `?escuela=inversion` (o `finanzas-personales`) que viene en la URL desde el `[queryParams]` del botón de la campana en Finanzas. Si existe, se usa para preseleccionar el filtro `escuelaActiva`, que ya existía en la página de Educación (el filtro de escuela se reutilizó, no se creó uno nuevo).

### Preguntas de práctica — Curso Banner / Educación

1. *"¿Por qué el banner usa `@Input()` en vez de que cada página tenga su propio texto quemado dentro del componente?"*
   Porque cada submódulo necesita un texto y un curso **distintos** (Finanzas recomienda presupuesto 50/30/20, Inversiones recomienda gestión de portafolio, etc.). Con `@Input()`, el mismo componente se reutiliza y cada página le "pasa" sus propios valores, en vez de tener que crear un componente distinto por cada submódulo.

2. *"¿Qué pasa si escribo un `cursoId` que no existe en el catálogo?"*
   `buscarCurso(cursoId)` devuelve `undefined` (no lanza un error), y como el `@if (curso)` del banner solo pinta si `curso` es verdadero, el banner simplemente no aparece — no rompe la página ni muestra un enlace vacío.

3. *"¿Cómo harías que la campana, en vez de mandar solo la escuela, preseleccionara también el nivel (básico/intermedio/avanzado)?"*
   Agregaría un segundo `queryParams`, por ejemplo `{ escuela: escuelaRecomendada, nivel: nivelRecomendado }`, y en `EducacionComponent.ngOnInit()` leería también `route.snapshot.queryParamMap.get('nivel')` para hacer `this.nivelActivo.set(nivel)`, reutilizando el signal `nivelActivo` que ya existe para el filtro de nivel.

---

## 11. Repaso rápido — preguntas cruzadas (todo el módulo)

Estas mezclan varios archivos a la vez, como suele preguntar un instructor para ver si entiendes el panorama completo y no solo un archivo aislado.

1. **"¿Cómo sabe Angular que debe redibujar la tarjeta de 'Disponible' cuando agrego un movimiento nuevo?"**
   `agregarRegistro()`/`FinanzasService.agregarMovimiento()` modifican el arreglo `movimientos`. Como `tarjetas` es un **getter normal** (no un signal), Angular no "escucha" ese cambio directamente — lo que pasa es que cualquier interacción del usuario (como el clic en "Agregar") dispara un ciclo de detección de cambios, y en ese ciclo Angular vuelve a ejecutar todos los getters usados en el template, incluido `tarjetas`, que al recalcularse con el arreglo actualizado, produce el nuevo valor.

2. **"Si dos usuarios usan la app en pestañas distintas del mismo navegador, ¿ven los mismos datos?"**
   Sí, porque los services son singletons a nivel de **aplicación cargada en memoria**, no por usuario ni por pestaña — pero como es una sola pestaña de navegador (una sola instancia de la app Angular corriendo), en la práctica esto se refiere a que **todos los componentes dentro de esa misma carga de la app** comparten los mismos datos. Si se abre una pestaña nueva, se recarga toda la aplicación desde cero y los signals/arreglos de los services vuelven a sus valores iniciales (porque son datos mock en memoria, no hay backend real que los persista).

3. **"¿Por qué casi todos los formularios de creación validan 'nombre no vacío y monto > 0' antes de guardar?"**
   Es la validación mínima para evitar registros basura (una meta sin nombre, una inversión de $0) sin necesitar una librería de validación de formularios — cada componente repite ese patrón simple (`if (!nombre || monto === null || monto <= 0) return;`) en vez de dejar que se guarde cualquier cosa.

4. **"¿Qué tienen en común Inversiones admin, Metas admin y Resuelve tu deuda admin?"**
   Los tres siguen exactamente el mismo esqueleto: un signal `busqueda` + `actualizarBusqueda()`, un signal de filtro por categoría (riesgo / estado / estado de solicitud) + su método `filtrarPorX()`, y un par `columnaOrden`/`ordenAscendente` + `ordenarPor(columna)` que se combinan en un solo getter (`xxxFiltradas`). Si entiendes uno de los tres a fondo, ya entiendes la lógica de los otros dos — solo cambian los nombres de los campos.

5. **"¿Dónde pondrías la lógica si mañana conectan un backend real (Node, Spring, lo que sea)?"**
   Dentro de cada *service* (`MetasService`, `InversionesService`, etc.), reemplazando el arreglo en memoria por llamadas HTTP (`HttpClient`) — de hecho, ya hay comentarios `// TODO: reemplazar por llamadas HTTP al backend real cuando esté listo` en cada uno. Los componentes casi no cambiarían, porque ya están escritos para depender del service y no de datos quemados directamente.

6. **"Agregaste un `patrimonioNeto` en Herramientas y una `escuelaRecomendada` en Finanzas — ¿por qué uno vive en el service y el otro directo en el componente?"**
   Depende de si el dato lo necesita **más de una pantalla**. `patrimonioNeto` hoy solo lo usa `HerramientasComponent`, así que vivir ahí es correcto y más simple. `escuelaRecomendada`, en cambio, es un cálculo que solo tiene sentido en Finanzas (mira cuántas inversiones/movimientos/metas tiene el usuario), así que tampoco necesita un service — la regla no es "todo debe estar en un service", es "si dos o más componentes necesitan el mismo dato sincronizado, ese dato va en un service"; si solo un componente lo usa, puede vivir tranquilamente adentro de él.

---

## 12. La paleta de colores de Finanzas (CSS variables y una trampa de Angular)

Esto no es lógica de negocio, pero es un tema que el instructor puede preguntar porque tiene una trampa técnica real de Angular — vale la pena entenderlo aunque sea "solo CSS".

### El pedido: una paleta nueva, pero *solo* en los submódulos de Finanzas
La tarea fue aplicar una paleta de colores de marca (definida por unos códigos hexadecimales) únicamente en Finanzas, Libro Mayor, Herramientas, Inversiones, Metas, Resuelve tu deuda y el menú de navegación entre ellos — sin tocar el login, el admin, el home, ni los estilos globales (`src/styles.css`) que usa el resto de la aplicación.

### Por qué NO se puede usar `:root` dentro del CSS de un componente
La forma "obvia" de definir una paleta reutilizable en CSS es declarar las variables en `:root`:
```css
:root {
  --sage: #24554C;
  --black: #25312B;
}
```
Pero si pones ese bloque dentro del archivo `.css` de un componente Angular (por ejemplo `finanzas.css`), **no funciona de forma confiable**. La razón es la *encapsulación de estilos* de Angular (`ViewEncapsulation.Emulated`, la que viene por defecto): Angular le agrega automáticamente un atributo único a cada elemento del template de ese componente (algo como `[_ngcontent-abc-12]`) y reescribe tus selectores CSS para que solo apliquen a elementos con ese atributo — así los estilos de un componente no se "escapan" y afectan a otros por accidente.

El problema es que ese atributo se le pone a los elementos **dentro** del template del componente (`<div class="finanzas">`, etc.), pero el elemento `<html>` real de la página — que es a quien apunta el selector `:root` — **nunca** recibe ese atributo, porque `<html>` vive fuera de cualquier componente Angular. Angular reescribe tu `:root { ... }` a algo como `:root[_ngcontent-abc-12] { ... }`, un selector que jamás va a hacer match con nada, así que las variables simplemente no se aplican (o se aplican de forma inconsistente, dependiendo del navegador y de si algún antepasado sí tiene el atributo).

### La solución: poner las variables en la clase raíz real del componente
En vez de `:root`, las variables se declararon en el selector de la clase que sí es un nodo real del DOM de ese componente — el `<div>` contenedor de más arriba en cada template:
```css
.finanzas {
    --sage: #24554C;
    --sage-dark: #25312B;
    --sage-tint: #E5EBEA;
    --sage-tint-strong: #CAD6D4;
    --black: #25312B;
    --sand: #A3A7A9;
    --floral-white: #E7E8E9;
    --cloud: #C8CACB;

    padding: 28px 32px;
    max-width: 1100px;
    margin: 0 auto;
}
```
`.finanzas` sí es un selector real: coincide con el `<div class="finanzas">` que envuelve todo el template de `FinanzasComponent`, así que Angular lo reescribe a `.finanzas[_ngcontent-abc-12]` y **eso sí hace match**, porque ese `<div>` sí tiene ese atributo. Como las variables CSS se heredan en cascada a todos los descendientes del elemento donde se declaran, cualquier cosa dentro de `<div class="finanzas">` puede usar `var(--sage)`, incluidos bindings dinámicos desde TypeScript/HTML (`[style.background]="gradienteDistribucion"`, `stroke="var(--sage)"` en un SVG) — esos son valores que el navegador resuelve en tiempo real en el DOM, así que no les afecta para nada la reescritura de selectores de Angular, que solo pasa a nivel de CSS estático.

Cada uno de los 7 submódulos (`finanzas.css`, `libro-mayor.css`, `herramientas.css`, `inversiones.css`, `metas.css`, `resuelve-deuda.css`, `finanzas-menu.css`) repite este mismo bloque de 8 variables dentro de su propia clase raíz (`.libro-mayor { ... }`, `.herramientas { ... }`, etc.) — no se comparte un solo bloque global, a propósito.

### Colores de marca vs. colores de estado — por qué no todo se reemplazó
No todos los colores del CSS se cambiaron a la paleta nueva. Se separaron en dos grupos:
- **Colores de marca/acento** (botones, links, bordes activos, fondos de tarjetas) → sí se reemplazaron por la paleta nueva.
- **Colores semánticos/de estado** (rojo para "gasto"/"error"/"alto riesgo", ámbar para "advertencia"/"pendiente", verde-amarillo-rojo en los puntos de riesgo de Inversiones) → se dejaron **sin tocar**, a propósito.

**Pregunta típica:** *"¿Por qué el rojo de 'gasto' o el ámbar de 'advertencia' no cambiaron junto con el resto?"*
**Respuesta:** Porque esos colores no son identidad de marca, son **significado universal**: rojo = negativo/peligro, ámbar = cuidado/pendiente, independientemente de qué paleta de marca esté usando la app en ese momento. Cambiarlos a un color de la nueva paleta (que no tiene rojo ni ámbar) rompería esa comunicación visual — un usuario espera que "rojo" siga significando "cuidado" sin importar el rediseño.

### Preguntas de práctica — Paleta de colores

1. *"¿Por qué se repite el mismo bloque de 8 variables en 7 archivos CSS distintos, en vez de definirlo una sola vez?"*
   Es la consecuencia directa de la restricción "solo en los submódulos de Finanzas, sin tocar los estilos globales": si se definiera una sola vez, tendría que ser en un lugar compartido por toda la app (como `src/styles.css`), pero ese archivo también lo usan el login, el admin y el resto de páginas — y la instrucción era explícita en que la paleta **no** debía afectarlos. La repetición es el costo de mantener el cambio verdaderamente aislado a Finanzas; la alternativa (un archivo CSS compartido solo entre los submódulos de Finanzas, importado por los 7) sería menos repetitivo pero es una refactorización más grande de la estructura de archivos del proyecto.

2. *"Si mañana quieren cambiar el verde principal por otro color, ¿cuántos archivos hay que tocar?"*
   7 — un `find & replace` del valor de `--sage` en cada uno de los 7 archivos `.css` de Finanzas. Ningún archivo `.ts` ni `.html` necesita tocarse, porque todos ellos usan `var(--sage)` (el nombre de la variable), nunca el código hexadecimal directo — ese es justamente el punto de usar variables CSS en vez de escribir el color a mano en cada regla.

3. *"¿Por qué los `paletaDona`/`paletaCarteras` en `finanzas.ts` e `inversiones.ts` (los colores de las gráficas de dona) son un arreglo de strings como `'var(--sage)'`, y no colores hexadecimales?"*
   Porque esos arreglos se usan para pintar un `background: conic-gradient(...)` armado dinámicamente en TypeScript — si tuvieran el hex quemado (`'#24554C'`), cambiar la paleta más adelante implicaría editar también esos dos archivos `.ts`, además de los 7 `.css`. Al usar `'var(--sage)'` como string, el navegador resuelve el valor real de esa variable en tiempo de ejecución (leyendo el CSS del componente), así que esos arreglos "heredan" el cambio de paleta automáticamente sin tocarlos.
