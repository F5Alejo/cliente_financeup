import { AfterViewInit, Component, ElementRef, OnDestroy, input, output, viewChild } from '@angular/core';
import { IconComponent } from '../icon/icon';

let contador = 0;

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-modal',
  imports: [IconComponent],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  titulo = input.required<string>();
  subtitulo = input('');
  ancho = input<'sm' | 'md' | 'lg'>('md');
  /** Evita cerrar al pulsar fuera; útil en formularios para no perder lo escrito. */
  fondoFijo = input(false);
  alertdialog = input(false);
  cerrar = output<void>();

  readonly idTitulo = `modal-titulo-${++contador}`;
  private panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private previo: HTMLElement | null = document.activeElement as HTMLElement | null;

  ngAfterViewInit(): void {
    const panel = this.panel().nativeElement;
    const primero =
      panel.querySelector<HTMLElement>(
        '.modal-cuerpo input:not([type="radio"]), .modal-cuerpo select, .modal-cuerpo textarea'
      ) ?? panel.querySelector<HTMLElement>('.modal-cuerpo input');
    (primero ?? panel).focus();
  }

  ngOnDestroy(): void {
    this.previo?.focus?.();
  }

  alPulsarFondo(evento: MouseEvent): void {
    if (!this.fondoFijo() && evento.target === evento.currentTarget) {
      this.cerrar.emit();
    }
  }

  alPulsarTecla(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      evento.stopPropagation();
      this.cerrar.emit();
      return;
    }

    if (evento.key !== 'Tab') {
      return;
    }

    const elementos = Array.from(this.panel().nativeElement.querySelectorAll<HTMLElement>(ENFOCABLES));
    if (elementos.length === 0) {
      return;
    }
    const primero = elementos[0];
    const ultimo = elementos[elementos.length - 1];
    const activo = document.activeElement;

    if (evento.shiftKey && (activo === primero || activo === this.panel().nativeElement)) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && activo === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }
}
