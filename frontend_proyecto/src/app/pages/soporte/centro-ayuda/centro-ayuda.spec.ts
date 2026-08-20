import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CentroAyudaConponent } from './centro-ayuda';

describe('CentroAyuda', () => {
  let component: CentroAyudaConponent;
  let fixture: ComponentFixture<CentroAyudaConponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CentroAyudaConponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CentroAyudaConponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
