import { ComponentFixture, TestBed } from '@angular/core/testing';

<<<<<<<< HEAD:frontend_proyecto/src/app/pages/soporte/ver-pqr/ver-pqr.spec.ts
import { VerPqrComponent } from './ver-pqr';

describe('VerPqr', () => {
  let component: VerPqrComponent;
  let fixture: ComponentFixture<VerPqrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerPqrComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VerPqrComponent);
========
import { FinanzasComponent } from './finanzas';

describe('Finanzas', () => {
  let component: FinanzasComponent;
  let fixture: ComponentFixture<FinanzasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanzasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinanzasComponent);
>>>>>>>> 792e7540e6b6f66917aa15833892238441882664:frontend_proyecto/src/app/pages/finanzas/finanzas/finanzas.spec.ts
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
