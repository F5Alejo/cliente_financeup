# 🎮 Finanzas de FinanceUp — explicado súper fácil

Hola, Juan. Vamos a jugar a entender el código como si fuera un videojuego. Yo soy tu instructor y tú vas a subir de nivel. Nada de tecnicismos raros de una — primero los personajes, después la aventura.

No hace falta que memorices nada. Al final de cada nivel hay un jueguito de preguntas para comprobar que de verdad entendiste, no que solo lo leíste.

---

## 🧸 Antes de empezar: los 3 personajes que aparecen SIEMPRE

Todo el código de Finanzas usa solo 3 "personajes" una y otra vez. Si entiendes estos 3, entiendes el 90% de todo.

### 1️⃣ La cajita mágica (`signal`)

Imagina una cajita de juguete que guarda un número o una palabra adentro. Tiene un truco especial: **cada vez que algo cambia adentro de la cajita, avisa a toda la pantalla para que se redibuje sola**, sin que tú tengas que refrescar nada.

```typescript
mostrarBusqueda = signal(false);   // la cajita empieza "cerrada" (false)
```

- Para **mirar** qué hay adentro: la llamas como si fuera un timbre → `mostrarBusqueda()`
- Para **cambiarla del todo**: `mostrarBusqueda.set(true)`
- Para **cambiarla según lo que ya tenía**: `mostrarBusqueda.update(v => !v)` (esto es literalmente "lo que sea que tengas, dale la vuelta": si estaba abierta, ciérrala; si estaba cerrada, ábrela)

📦 Piénsalo como un interruptor de luz que, cuando lo tocas, avisa a toda la casa "¡oigan, cambié!".

### 2️⃣ El cuaderno compartido (`service`)

Imagina un cuaderno mágico que está flotando en el aire de la casa. **Cualquier cuarto de la casa puede escribir o leer en el mismo cuaderno.** No hay copias — es EL mismo cuaderno para todos.

```typescript
export class MetasService {
  metas: Meta[] = [ ... ];   // los datos reales viven aquí, no en cada cuarto
}
```

Por eso, si tú creas una meta nueva en tu cuarto de "Metas", el admin que está mirando su propio cuarto de "Admin" ve exactamente la misma meta — porque los dos están leyendo el mismo cuaderno, no cuadernos separados.

### 3️⃣ El robot calculador (`get algo()`)

Imagina un robotito que, cada vez que le preguntas algo, va corriendo al cuaderno compartido, hace cuentas, y te da la respuesta fresca en el momento — nunca te da una respuesta vieja.

```typescript
get tarjetas(): TarjetaResumen[] {
  // corre al cuaderno, suma todo, y arma las 4 tarjetitas de arriba
}
```

Tú nunca le dices al robot "recalcula" — él simplemente **siempre** recalcula solo, cada vez que la pantalla necesita mostrar algo.

**¿Ya los tienes claros?** 🧠 Cajita = guarda y avisa. Cuaderno = un solo dato para todos. Robot = calcula fresco cada vez. Vamos a verlos trabajando juntos en Finanzas.

---

## 🗺️ Nivel 1 — El mapa de la pantalla de Finanzas

Cuando entras a Finanzas, la pantalla es como una casa con cuartos, de arriba hacia abajo:

```
🏠 Encabezado (tu saludo + lupa 🔍 + campanita 🔔)
🚦 Semáforo de salud financiera
🎴 4 tarjetitas resumen (Ingreso, Gastos, Disponible, Ahorro)
🍕 Gráfica de pizza (en qué gastaste) + 🎢 gráfica de montaña rusa (inversión)
📋 Tabla de movimientos recientes
🎯 Tus metas (como barras de vida de videojuego)
🏦 Cuarto de Activos, Pasivos y Gastos (con formulario)
📣 Anuncio de un curso
```

Cada uno de estos "cuartos" es una sección del HTML (`finanzas.html`), y cada uno tiene su robotito calculador correspondiente en `finanzas.ts`. Vamos cuarto por cuarto.

---

## 🔍🔔 Nivel 2 — El encabezado: la lupa y la campanita

```html
<button (click)="alternarBusqueda()">🔍</button>
<a [routerLink]="['/educacion']" [queryParams]="{ escuela: escuelaRecomendada }">🔔</a>
```

**La lupa** es un interruptor (¿recuerdas la cajita mágica?). Cada clic llama a:
```typescript
alternarBusqueda(): void {
  this.mostrarBusqueda.update((v) => !v);
  if (!this.mostrarBusqueda()) this.terminoBusqueda.set('');
}
```
Como si fuera un cajón: clic lo abre, clic de nuevo lo cierra. Y cuando lo cierras, además borra lo que habías escrito (`terminoBusqueda.set('')`) — para que la próxima vez que lo abras, empiece limpio.

Cuando está abierta, tienes un buscador mágico que revisa **4 lugares distintos de la casa a la vez**: los cuartos (Finanzas, Metas, Inversiones...), tus metas, tus inversiones y tus movimientos. Todo eso lo hace un solo robot:

```typescript
get resultadosBusqueda(): ResultadoBusqueda[] {
  const secciones = this.secciones.filter(...)       // busca en los cuartos
  const metas = this.metasService.metas.filter(...)  // busca en el cuaderno de metas
  const inversiones = this.inversionesService.inversiones.filter(...) // cuaderno de inversiones
  const movimientos = this.todosLosMovimientos.filter(...) // cuaderno de movimientos
  return [...secciones, ...metas, ...inversiones, ...movimientos]; // los junta todos
}
```

🧩 Es como si el robot corriera a 4 cuadernos distintos, buscara la palabra que escribiste en cada uno, y volviera con una sola lista de resultados.

**La campanita** ya no es un botón — es un enlace que te lleva a Educación, pero **le regala un dato extra en la URL** (`?escuela=inversion` o `?escuela=finanzas-personales`) para que, al llegar, ya esté elegida la escuela de cursos que más te conviene:

```typescript
get escuelaRecomendada(): string {
  const actividadInversion = this.inversionesService.inversiones.length;
  const actividadPersonal = this.todosLosMovimientos.length + this.metasService.metas.length;
  return actividadInversion > actividadPersonal ? 'inversion' : 'finanzas-personales';
}
```

🕵️ El robot cuenta: "¿tienes más inversiones, o más movimientos+metas juntos?" El que gane, ese te recomienda. Es como un amigo que te mira jugar y te dice "veo que juegas más fútbol que básquet, te recomiendo el curso de fútbol".

**Pregunta sorpresa 🎯:** *Si tienes 3 inversiones y en total 10 movimientos + metas, ¿a qué escuela te manda la campanita?*
→ A "finanzas-personales", porque 10 es mayor que 3.

---

## 🚦 Nivel 3 — El semáforo de salud financiera

```typescript
get salud() {
  const disponible = this.totalIngresos - this.totalGastos;
  if (disponible < 0) return { estado: 'Alto riesgo', mensaje: 'Estás gastando más de lo que ganas.' };
  if (ahorroPct < 10) return { estado: 'Atención', mensaje: 'Tu margen de ahorro es bajo...' };
  return { estado: 'En orden', mensaje: 'Tus finanzas van bien, sigue así.' };
}
```

Piénsalo como el semáforo de un juego de carreras:
- 🔴 **Rojo (Alto riesgo)**: gastaste más monedas de las que ganaste. ¡Cuidado, te estás quedando sin vidas!
- 🟡 **Amarillo (Atención)**: te sobran monedas, pero muy pocas — estás guardando menos del 10%.
- 🟢 **Verde (En orden)**: vas bien, sigue jugando así.

El robot revisa las condiciones **en orden**, de arriba hacia abajo, y se detiene en la primera que sea verdad — por eso el orden importa: primero pregunta lo más grave (¿estás en números rojos?), y solo si esa respuesta es "no", pasa a la siguiente pregunta.

**Pregunta sorpresa 🎯:** *Si ganaste $100 y gastaste $95 (te sobran solo $5, un 5%), ¿qué color sale?*
→ Amarillo. `disponible` es $5, que no es menor a 0, así que no entra al rojo. Pero `ahorroPct` es 5%, que sí es menor a 10, así que cae en Atención.

---

## 🎴 Nivel 4 — Las 4 tarjetitas (cromos de colección)

```typescript
get tarjetas(): TarjetaResumen[] {
  const disponible = this.totalIngresos - this.totalGastos;
  const ahorroPct = ...;
  return [
    { icono: '💰', titulo: 'Ingreso', valor: ... },
    { icono: '💼', titulo: 'Gastos', valor: ... },
    { icono: '🏦', titulo: 'Disponible', valor: ... },
    { icono: '🐷', titulo: 'Ahorro', valor: `${ahorroPct}%` },
  ];
}
```

Son 4 cromos que el robot arma cada vez, sumando y restando el cuaderno de movimientos. En el HTML, en vez de escribir 4 veces la misma tarjeta, se usa un molde que se repite:

```html
@for (t of tarjetas; track t.titulo) {
  <div class="card-resumen">
    <span>{{ t.icono }}</span> <span>{{ t.titulo }}</span> <span>{{ t.valor }}</span>
  </div>
}
```

🍪 Como un molde de galletas: el robot te da 4 "masas" (los 4 objetos del arreglo `tarjetas`), y el molde `@for` las hornea todas con la misma forma, una por una.

**Pregunta sorpresa 🎯:** *Si el cuaderno de movimientos tiene un ingreso de $200.000 y un gasto de $50.000, ¿qué dice la tarjeta "Disponible"?*
→ $150.000 (200.000 − 50.000). Y la de "Ahorro" diría 75% (150.000 / 200.000 × 100).

---

## 🍕🎢 Nivel 5 — Las dos gráficas

**La pizza (dona de gastos):** el robot junta todos tus gastos por categoría (comida, transporte, etc.) en un mapa (`Map`), y calcula qué porcentaje de la pizza es cada sabor:

```typescript
get distribucion(): SegmentoGasto[] {
  const porCategoria = new Map<string, number>();
  gastos.forEach(m => porCategoria.set(m.categoria, (porCategoria.get(m.categoria) ?? 0) + Math.abs(m.monto)));
  return Array.from(porCategoria.entries()).map(([etiqueta, monto], i) => ({
    etiqueta, porcentaje: Math.round((monto / total) * 100), color: this.paletaDona[i % this.paletaDona.length]
  }));
}
```

Y no es una imagen ni una librería — ¡es puro CSS! `gradienteDistribucion` arma una receta de colores como si fuera una torta:
```typescript
`conic-gradient(${partes.join(', ')})`  // ejemplo: "verde 0% 40%, azul 40% 70%, gris 70% 100%"
```
Le estás diciendo al navegador "pinta de verde desde el 0% hasta el 40% del círculo, luego de azul del 40% al 70%..." y así se dibuja la pizza sin necesitar ni una imagen.

**La montaña rusa (línea de crecimiento):** convierte una lista de números en puntos de un dibujo:
```typescript
get puntosLinea(): string {
  const max = Math.max(...datos.map(d => d.valor));
  const min = Math.min(...datos.map(d => d.valor));
  return datos.map((d, i) => {
    const x = (i / (datos.length - 1)) * 320;               // reparte los puntos a lo ancho
    const y = 90 - ((d.valor - min) / (max - min || 1)) * 90; // más alto el valor, más arriba el punto
    return `${x},${y}`;
  }).join(' ');
}
```
🎢 Imagina que tienes 6 fichas con números (uno por mes) y las tienes que poner sobre una hoja: la más chiquita va abajo del todo, la más grande va arriba del todo, y las demás quedan repartidas según qué tan grandes son comparadas con esas dos. Luego se traza una línea que las conecta — esa línea es tu montaña rusa.

**Pregunta sorpresa 🎯:** *Si tienes 3 categorías de gastos con 50%, 30% y 20% de la pizza, ¿cuántos "colores" distintos verías en la lista `distribucion`?*
→ 3, uno por cada categoría — el robot crea un objeto `{etiqueta, porcentaje, color}` por cada sabor distinto que encontró en el cuaderno de movimientos.

---

## 🎯 Nivel 6 — Tus metas (barras de vida)

```html
<circle [attr.stroke-dasharray]="circunferencia" [attr.stroke-dashoffset]="obtenerOffset(meta.porcentaje)" />
```
```typescript
obtenerOffset(porcentaje: number): number {
  return this.circunferencia * (1 - porcentaje / 100);
}
```

Cada meta se dibuja como un anillo, igualito a la barra de vida de un personaje de videojuego. El truco es que el círculo del SVG en realidad está **dibujado completo siempre**, pero se le "esconde" un pedazo con `stroke-dashoffset`: si la meta va al 72%, se esconde el 28% restante del círculo, y por eso se ve como si solo estuviera "lleno" el 72%.

🍩 Imagina una dona completa, pero le tapas con un dedo el pedazo que todavía te falta por comer. Si comiste el 72%, tapas el 28% que sobra.

En Finanzas solo se muestran 4 metas de vista previa (`metasService.metas.slice(0, 4)`) — como un resumen rápido; la pantalla completa de todas tus metas está en el cuarto de "Metas".

---

## 🏦 Nivel 7 — Activos, Pasivos y Gastos (el cuartito con pestañas)

Este cuartito es como una mochila con 3 bolsillos: Activos (cosas que tienes: ahorros, un carro), Pasivos (cosas que debes: una tarjeta de crédito) y Gastos (cosas que pagaste: arriendo, servicios).

```typescript
tipoActivo = signal<TipoRegistro>('activos');   // ¿qué bolsillo estás mirando ahora?

registros: Record<TipoRegistro, RegistroFinanciero[]> = {
  activos: [...], pasivos: [...], gastos: [...],
};
```

Al hacer clic en una pestaña, cambias la cajita `tipoActivo`, y el robot `listaActiva` te muestra solo el bolsillo que elegiste:
```typescript
get listaActiva(): RegistroFinanciero[] {
  return this.registros[this.tipoActivo()];
}
```

Y hay un robot extra que hace la cuenta más importante de todo el cuarto — tu **patrimonio neto** (cuánto tienes de verdad, restando lo que debes):
```typescript
get patrimonioNeto(): number {
  return this.totalActivos - this.totalPasivos;
}
```

💰 Es la pregunta: "si vendieras todo lo que tienes y pagaras todo lo que debes, ¿con cuánto te quedas?" Ese número es tu patrimonio neto.

**Pregunta sorpresa 🎯:** *Si tienes $16.000.000 en activos y $900.000 en pasivos, ¿cuál es tu patrimonio neto?*
→ $15.100.000 (16.000.000 − 900.000).

---

## 📣 Nivel final — El anuncio del curso

```html
<app-curso-banner
  texto="Reparte tu sueldo en tres bolsillos y deja de improvisar cada mes, ¿cómo se hace?"
  cursoId="presupuesto-50-30-20">
</app-curso-banner>
```

Es un cartelito reutilizable (lo construimos una sola vez, y se usa en 5 pantallas distintas). Le pasas una pregunta gancho y el "id" de un curso real, y él solo se encarga de buscar ese curso en el catálogo y armar el enlace — si el curso no existiera, simplemente no se muestra nada, en vez de romper la pantalla.

---

## 🏆 El examen final — 10 preguntas rápidas (como trivia)

Respóndelas en voz alta ANTES de leer la respuesta. Tápate la respuesta con la mano si quieres jugar en serio.

1. **¿Qué hace `.update(v => !v)` en una cajita mágica?**
   → Le da la vuelta al valor que ya tenía (si era `true` lo pone `false`, y viceversa).

2. **¿Por qué el admin y el usuario ven las mismas metas sin recargar la página?**
   → Porque ambos leen el mismo cuaderno compartido (`MetasService`), no cuadernos separados.

3. **¿Qué pasaría si `totalIngresos` fuera 0 al calcular el porcentaje de ahorro?**
   → El robot revisa primero si es mayor a 0; si no, pone directamente 0%, para no dividir entre cero.

4. **¿Qué le regala la campanita 🔔 a la URL cuando la tocas?**
   → `?escuela=inversion` o `?escuela=finanzas-personales`, según cuál escuela te conviene más.

5. **¿Cómo sabe el buscador (lupa 🔍) en cuáles 4 lugares buscar?**
   → Revisa 4 cuadernos: la lista fija de cuartos, el cuaderno de metas, el de inversiones y el de movimientos.

6. **¿Por qué la pizza de gastos no es una imagen?**
   → Está hecha con `conic-gradient` de CSS puro, como una receta de colores por porcentaje.

7. **¿Qué esconde `stroke-dashoffset` en el anillo de una meta?**
   → El pedazo del círculo que todavía te falta por completar.

8. **¿Qué bolsillo de la mochila (activos/pasivos/gastos) ves si `tipoActivo()` vale `'pasivos'`?**
   → Solo la lista de pasivos, porque `listaActiva` devuelve `registros[this.tipoActivo()]`.

9. **¿Cómo se calcula el patrimonio neto?**
   → Total de activos menos total de pasivos.

10. **¿Qué pasa si el `cursoId` del banner no existe en el catálogo?**
    → El robot `curso` devuelve nada (`undefined`), y como el banner solo se dibuja `@if (curso)`, simplemente desaparece sin romper la pantalla.

¿Cuántas te supiste sin ver la respuesta? Si te trabaste en alguna, vuelve al nivel de esa pregunta y léelo una vez más — no memorices, solo vuelve a ver el dibujito mental (cajita, cuaderno, robot) y va a hacer clic solo.
