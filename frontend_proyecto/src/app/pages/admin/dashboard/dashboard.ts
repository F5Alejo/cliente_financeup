import { Component } from '@angular/core';
import { AdminMenuComponent } from '../admin-menu/admin-menu';
import { AlianzasService } from '../../../services/alianzas';
import { EducacionService } from '../../../services/educacion';
import { FinanzasService } from '../../../services/finanzas';
import { PqrService } from '../../../services/pqr';

@Component({
  selector: 'app-admin-dashboard',
  imports: [AdminMenuComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class AdminDashboardComponent {
  constructor(
    public alianzasService: AlianzasService,
    public educacionService: EducacionService,
    public finanzasService: FinanzasService,
    public pqrService: PqrService
  ) {}

  get totalCursos(): number {
    return this.educacionService.escuelas.reduce((total, e) => total + e.cursos.length, 0);
  }
}
