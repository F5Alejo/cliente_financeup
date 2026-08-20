import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineaAyudaComponent } from './linea-ayuda';

describe('LineaAyuda', () => {
  let component: LineaAyudaComponent;
  let fixture: ComponentFixture<LineaAyudaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineaAyudaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineaAyudaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
