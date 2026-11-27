import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { AuthService } from '../../services/auth';
import { IconComponent } from '../../shared/components/icon/icon';
import { LogoComponent } from '../../shared/components/logo/logo';
import { MonedaPipe } from '../../pipes/moneda.pipe';

gsap.registerPlugin(ScrollTrigger, SplitText);

interface Movimiento {
  concepto: string;
  categoria: string;
  valor: number;
  tipo: 'ingreso' | 'gasto';
}

interface Meta {
  nombre: string;
  actual: number;
  objetivo: number;
}

interface CursoVista {
  titulo: string;
  nivel: string;
  duracion: string;
}

interface ProductoVista {
  categoria: string;
  aliado: string;
}

interface PasoPqr {
  texto: string;
  fecha: string;
  hecho: boolean;
}

interface PasoInicio {
  titulo: string;
  texto: string;
  alto: number;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, IconComponent, LogoComponent, MonedaPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  private readonly raiz = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly moneda = new MonedaPipe();
  private animaciones?: gsap.MatchMedia;
  /** Listeners del puntero; se quitan cuando matchMedia revierte. */
  private limpiezas: Array<() => void> = [];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // GSAP se monta cuando el DOM ya existe y se revierte entero al salir de la página.
    afterNextRender(() => this.animar());
    inject(DestroyRef).onDestroy(() => this.animaciones?.revert());
  }

  /** Alturas (en %) de las barras del símbolo del logo que suben en el hero. */
  barrasHero = [22, 34, 30, 48, 62, 56, 78, 100];

  /** Horizonte de barras ascendentes al pie del hero (el motivo del logo, repetido). */
  horizonte = Array.from({ length: 48 }, (_, i) => Math.round(8 + (i / 47) * 82 + Math.sin(i * 1.7) * 7));

  /** Lo que se hace en FinanceUp, en la cinta de marca. */
  cinta = ['Ahorra', 'Aprende', 'Invierte', 'Cumple tus metas', 'Pide crédito', 'Pide ayuda'];

  // Vistas previas de cada módulo: los mismos datos de ejemplo que trae la app.
  movimientos: Movimiento[] = [
    { concepto: 'Salario', categoria: 'Salario', valor: 3000000, tipo: 'ingreso' },
    { concepto: 'Arriendo', categoria: 'Vivienda', valor: 1200000, tipo: 'gasto' },
    { concepto: 'Mercado', categoria: 'Alimentación', valor: 450000, tipo: 'gasto' },
    { concepto: 'Freelance diseño', categoria: 'Otros ingresos', valor: 500000, tipo: 'ingreso' },
  ];

  metas: Meta[] = [
    { nombre: 'Vacaciones', actual: 1800000, objetivo: 2500000 },
    { nombre: 'Fondo de emergencia', actual: 800000, objetivo: 2000000 },
  ];

  cursos: CursoVista[] = [
    { titulo: 'Presupuesto 50/30/20', nivel: 'Básico', duracion: '30 min' },
    { titulo: 'Entiende tu puntaje de crédito', nivel: 'Básico', duracion: '45 min' },
    { titulo: 'Sal de deudas con el método bola de nieve', nivel: 'Intermedio', duracion: '28 min' },
  ];

  productos: ProductoVista[] = [
    { categoria: 'Crédito de libre inversión', aliado: 'Banco Andino' },
    { categoria: 'Tarjeta de crédito digital', aliado: 'Fintech Luz' },
    { categoria: 'Microcrédito', aliado: 'MicroCrédito Ya' },
  ];

  pasosPqr: PasoPqr[] = [
    { texto: 'Recibimos tu solicitud', fecha: '12 mar', hecho: true },
    { texto: 'Un asesor la está revisando', fecha: '13 mar', hecho: true },
    { texto: 'Te respondemos por aquí y por correo', fecha: 'Pendiente', hecho: false },
  ];

  /** Tres pasos para empezar: cada uno es una barra más alta, como el logo. */
  pasosInicio: PasoInicio[] = [
    { titulo: 'Crea tu cuenta', texto: 'Regístrate con tu correo. Es gratis y toma un par de minutos.', alto: 38 },
    { titulo: 'Anota tus movimientos', texto: 'Registra ingresos y gastos y mira en qué se va tu dinero.', alto: 66 },
    { titulo: 'Fija una meta y aprende', texto: 'Separa dinero para lo que quieres y toma un curso corto para lograrlo.', alto: 100 },
  ];

  get saldo(): number {
    return this.movimientos.reduce((total, m) => total + (m.tipo === 'ingreso' ? m.valor : -m.valor), 0);
  }

  porcentaje(meta: Meta): number {
    return Math.round((meta.actual / meta.objetivo) * 100);
  }

  get autenticado(): boolean {
    return this.authService.estaAutenticado();
  }

  get textoBotonPrincipal(): string {
    return this.autenticado ? 'Ir a mis finanzas' : 'Crear mi cuenta';
  }

  /** Botón principal (hero y cierre): a finanzas con sesión, a registro sin ella. */
  onEmpezar(): void {
    this.router.navigate([this.autenticado ? '/finanzas' : '/register']);
  }

  // =====================================================================
  // ANIMACIONES (GSAP + ScrollTrigger). Con "reducir movimiento" no corre
  // nada y la página queda en su estado final, que es el que pinta el CSS.
  // =====================================================================
  private animar(): void {
    const root = this.raiz.nativeElement;
    this.animaciones = gsap.matchMedia();
    this.animaciones.add(
      {
        movimiento: '(prefers-reduced-motion: no-preference)',
        puntero: '(hover: hover) and (pointer: fine)',
      },
      (contexto) => {
        const { movimiento, puntero } = contexto.conditions as { movimiento: boolean; puntero: boolean };
        if (!movimiento) return;

        this.animarHero(root);
        this.animarCinta(root);
        this.animarModulos(root);
        this.animarPasosInicio(root);
        this.animarCierre(root);
        this.animarProgreso(root);
        if (puntero) {
          this.parallaxHero(root);
          this.inclinarVistas(root);
          this.botonesMagneticos(root);
        }
        return () => {
          this.limpiezas.forEach((quitar) => quitar());
          this.limpiezas = [];
        };
      },
      root
    );
  }

  private animarHero(root: HTMLElement): void {
    const hero = root.querySelector<HTMLElement>('.hero');
    if (!hero) return;
    // Selector acotado al hero: el cierre reutiliza .hero-acciones y no debe tocarse aquí.
    const q = gsap.utils.selector(hero);
    const titulo = SplitText.create(q('.hero-titulo'), { type: 'words', mask: 'words' });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(titulo.words, { yPercent: 115, rotate: 4, duration: 1.1, stagger: 0.07 })
      .from(q('.hero-subtitulo'), { y: 24, autoAlpha: 0, duration: 0.9 }, '-=0.7')
      .from(q('.hero-acciones .btn'), { y: 18, autoAlpha: 0, scale: 0.92, duration: 0.7, stagger: 0.1 }, '-=0.6')
      .from(q('.horizonte span'), { scaleY: 0, duration: 0.9, stagger: { each: 0.012, from: 'start' } }, 0.1)
      .from(q('.barra'), { scaleY: 0, duration: 1, ease: 'back.out(1.6)', stagger: 0.07 }, 0.35)
      .from(q('.flecha polyline:not(.punta)'), { strokeDashoffset: 1, duration: 1.1, ease: 'power2.inOut' }, 0.95)
      .from(q('.flecha .punta'), { strokeDashoffset: 1, duration: 0.35, ease: 'power2.out' }, '>-0.05')
      .from(q('.chip'), { autoAlpha: 0, scale: 0.6, y: 30, duration: 0.8, ease: 'back.out(2)', stagger: 0.18 }, 1.5);

    // Los chips flotan suave y sin fin, cada uno a su ritmo.
    q('.chip-cuerpo').forEach((chip, i) => {
      gsap.to(chip, { y: i % 2 ? 10 : -10, duration: 2.4 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

    // El brillo de fondo deriva lento.
    gsap.to(q('.hero-brillo'), {
      xPercent: -18,
      yPercent: 14,
      scale: 1.15,
      duration: 9,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // Al bajar, el contenido del hero se aleja y el horizonte crece.
    gsap.timeline({
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
    })
      .to(q('.hero-copy'), { yPercent: -18, autoAlpha: 0.2, ease: 'none' }, 0)
      .to(q('.hero-simbolo'), { yPercent: -30, ease: 'none' }, 0)
      .to(q('.horizonte'), { scaleY: 1.6, ease: 'none' }, 0);
  }

  private parallaxHero(root: HTMLElement): void {
    const hero = root.querySelector<HTMLElement>('.hero');
    if (!hero) return;
    const capas = gsap.utils.toArray<HTMLElement>('[data-prof]', root).map((el) => ({
      prof: Number(el.dataset['prof']),
      x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' }),
    }));
    const mover = (e: PointerEvent) => {
      const caja = hero.getBoundingClientRect();
      const dx = (e.clientX - caja.left) / caja.width - 0.5;
      const dy = (e.clientY - caja.top) / caja.height - 0.5;
      capas.forEach((c) => {
        c.x(dx * c.prof);
        c.y(dy * c.prof);
      });
    };
    this.escuchar(hero, 'pointermove', mover);
  }

  private escuchar(el: HTMLElement, tipo: 'pointermove' | 'pointerleave', fn: (e: PointerEvent) => void): void {
    el.addEventListener(tipo, fn);
    this.limpiezas.push(() => el.removeEventListener(tipo, fn));
  }

  private animarCinta(root: HTMLElement): void {
    const pista = root.querySelector<HTMLElement>('.cinta-pista');
    if (!pista) return;
    const bucle = gsap.to(pista, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    // Al hacer scroll rápido la cinta acelera y luego vuelve a su ritmo.
    ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const empuje = gsap.utils.clamp(1, 6, 1 + Math.abs(self.getVelocity()) / 400);
        gsap.to(bucle, {
          timeScale: empuje,
          duration: 0.2,
          overwrite: true,
          onComplete: () => void gsap.to(bucle, { timeScale: 1, duration: 1.2 }),
        });
      },
    });
  }

  private animarModulos(root: HTMLElement): void {
    gsap.utils.toArray<HTMLElement>('.modulo', root).forEach((modulo) => {
      const q = gsap.utils.selector(modulo);
      const titulo = SplitText.create(q('.modulo-titulo'), { type: 'lines', mask: 'lines' });
      const invertido = modulo.querySelector('.modulo-inner-invertido') !== null;

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        scrollTrigger: { trigger: modulo, start: 'top 72%', once: true },
      });
      tl.from(titulo.lines, { yPercent: 110, duration: 1, stagger: 0.1 })
        .from(q('.modulo-desc, .enlace-modulo'), { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, '-=0.7')
        .from(
          q('.vista'),
          { x: invertido ? -80 : 80, rotationY: invertido ? 12 : -12, autoAlpha: 0, duration: 1.2, transformPerspective: 1000 },
          0
        )
        .from(q('.movimientos li, .cursos li, .productos li'), { y: 24, autoAlpha: 0, duration: 0.6, stagger: 0.09 }, 0.35)
        .from(q('.meta-barra span'), { scaleX: 0, duration: 1.4, ease: 'power3.out', stagger: 0.15 }, 0.6)
        .from(q('.meta-pct'), { textContent: 0, snap: { textContent: 1 }, duration: 1.4, ease: 'power3.out', stagger: 0.15 }, 0.6)
        .from(q('.producto-accion'), { scale: 0, duration: 0.5, ease: 'back.out(2.5)', stagger: 0.09 }, 0.7)
        .from(q('.estado-pqr'), { scale: 0, duration: 0.5, ease: 'back.out(2.5)' }, 0.5)
        .from(q('.paso-punto'), { scale: 0, duration: 0.45, ease: 'back.out(3)', stagger: 0.35 }, 0.6)
        .from(q('.pasos li'), { '--linea': 0, duration: 0.5, ease: 'power2.inOut', stagger: 0.35 }, 0.8);

      // El saldo cuenta hasta su valor real.
      const cifra = modulo.querySelector<HTMLElement>('.vista-cifra');
      if (cifra) {
        const contador = { v: 0 };
        tl.to(
          contador,
          {
            v: this.saldo,
            duration: 1.6,
            ease: 'power3.out',
            onUpdate: () => (cifra.textContent = this.moneda.transform(Math.round(contador.v))),
          },
          0.3
        );
      }
    });
  }

  private animarPasosInicio(root: HTMLElement): void {
    const seccion = root.querySelector<HTMLElement>('.inicio');
    if (!seccion) return;
    const q = gsap.utils.selector(seccion);
    const titulo = SplitText.create(q('.inicio-titulo'), { type: 'words', mask: 'words' });

    gsap.from(titulo.words, {
      yPercent: 115,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: seccion, start: 'top 75%', once: true },
    });

    // Las barras de los pasos crecen siguiendo el scroll y la flecha las une.
    gsap
      .timeline({ scrollTrigger: { trigger: q('.inicio-pasos')[0], start: 'top 80%', end: 'bottom 55%', scrub: 0.8 } })
      .from(q('.inicio-barra'), { scaleY: 0, ease: 'none', stagger: 0.25 }, 0)
      .from(q('.inicio-paso .inicio-texto'), { y: 30, autoAlpha: 0, ease: 'none', stagger: 0.25 }, 0.1)
      .from(q('.inicio-flecha polyline'), { strokeDashoffset: 1, ease: 'none', duration: 0.9 }, 0.2);
  }

  private animarCierre(root: HTMLElement): void {
    const cierre = root.querySelector<HTMLElement>('.cierre');
    if (!cierre) return;
    const q = gsap.utils.selector(cierre);
    const titulo = SplitText.create(q('.cierre-titulo'), { type: 'words', mask: 'words' });

    gsap
      .timeline({ defaults: { ease: 'expo.out' }, scrollTrigger: { trigger: cierre, start: 'top 70%', once: true } })
      .from(q('.cierre-simbolo'), { scale: 0.3, rotate: -25, autoAlpha: 0, duration: 1.2, ease: 'back.out(1.8)' })
      .from(titulo.words, { yPercent: 115, duration: 1, stagger: 0.07 }, 0.2)
      .from(q('.cierre-desc'), { y: 20, autoAlpha: 0, duration: 0.8 }, 0.5)
      .from(q('.cierre-acciones .btn'), { y: 20, autoAlpha: 0, scale: 0.9, duration: 0.7, stagger: 0.1 }, 0.65);

    gsap.to(q('.cierre-halo'), { scale: 1.25, autoAlpha: 0.55, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  /** Barra lima arriba que marca cuánto llevas de la página. */
  private animarProgreso(root: HTMLElement): void {
    gsap.to(root.querySelector('.progreso'), {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
    });
  }

  /** Las vistas previas se inclinan hacia el puntero. */
  private inclinarVistas(root: HTMLElement): void {
    gsap.utils.toArray<HTMLElement>('.vista', root).forEach((vista) => {
      const rx = gsap.quickTo(vista, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const ry = gsap.quickTo(vista, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      gsap.set(vista, { transformPerspective: 1000 });
      const mover = (e: PointerEvent) => {
        const caja = vista.getBoundingClientRect();
        ry(((e.clientX - caja.left) / caja.width - 0.5) * 8);
        rx(-((e.clientY - caja.top) / caja.height - 0.5) * 8);
      };
      const salir = () => {
        rx(0);
        ry(0);
      };
      this.escuchar(vista, 'pointermove', mover);
      this.escuchar(vista, 'pointerleave', salir);
    });
  }

  /** Los botones de marca siguen un poco al puntero. */
  private botonesMagneticos(root: HTMLElement): void {
    gsap.utils.toArray<HTMLElement>('.btn-lima', root).forEach((boton) => {
      const x = gsap.quickTo(boton, 'x', { duration: 0.5, ease: 'power3.out' });
      const y = gsap.quickTo(boton, 'y', { duration: 0.5, ease: 'power3.out' });
      const mover = (e: PointerEvent) => {
        const caja = boton.getBoundingClientRect();
        x((e.clientX - caja.left - caja.width / 2) * 0.3);
        y((e.clientY - caja.top - caja.height / 2) * 0.4);
      };
      const salir = () => {
        x(0);
        y(0);
      };
      this.escuchar(boton, 'pointermove', mover);
      this.escuchar(boton, 'pointerleave', salir);
    });
  }
}
