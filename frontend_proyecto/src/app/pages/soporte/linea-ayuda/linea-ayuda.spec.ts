import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LineaAyudaComponent } from './linea-ayuda';

describe('LineaAyuda', () => {
  let component: LineaAyudaComponent;
  let fixture: ComponentFixture<LineaAyudaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineaAyudaComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LineaAyudaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
