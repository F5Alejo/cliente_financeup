import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminMenuComponent } from '../admin-menu/admin-menu';
import { AlianzasService, Oferta } from '../../../services/alianzas';

@Component({
  selector: 'app-admin-alianzas',
  imports: [CommonModule, FormsModule, AdminMenuComponent],
  templateUrl: './alianzas.html',
  styleUrl: './alianzas.css',
})
export class AdminAlianzasComponent {
  constructor(public alianzasService: AlianzasService) {}

  editandoId: string | null = null;

  formOferta: Oferta = this.formularioVacio();

  private formularioVacio(): Oferta {
    return {
      id: '',
      aliado: '',
      descripcion: '',
      meta: '',
      logoBg: 'linear-gradient(135deg, #0f3d22 0%, #0a5c28 100%)',
      logoText: '',
      ctaPrimaria: 'Solicitar',
      tipo: 'Bancos',
      beneficio: '0% Interés',
      perfiles: ['Score Alto'],
      categoria: '',
      tasaDesde: 0,
      montoMaximo: 0,
      plazoMaximo: 0,
      aprobacion: '',
      calificacion: 0,
      usuarios: 0,
      compatibilidad: 0,
      destacada: false,
      etiquetas: [],
      requisitos: [],
    };
  }

  editarOferta(oferta: Oferta): void {
    this.editandoId = oferta.id;
    this.formOferta = { ...oferta };
  }

  cancelarEdicion(): void {
    this.editandoId = null;
    this.formOferta = this.formularioVacio();
  }

  guardarOferta(): void {
    if (!this.formOferta.aliado.trim()) {
      return;
    }

    if (this.editandoId) {
      this.alianzasService.editarOferta(this.editandoId, this.formOferta);
    } else {
      this.formOferta.id = 'oferta-' + Date.now();
      this.alianzasService.agregarOferta(this.formOferta);
    }

    this.cancelarEdicion();
  }

  eliminarOferta(id: string): void {
    this.alianzasService.eliminarOferta(id);
    if (this.editandoId === id) {
      this.cancelarEdicion();
    }
  }
}
