import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FinanzasComponent } from './finanzas';

describe('Finanzas', () => {
  let component: FinanzasComponent;
  let fixture: ComponentFixture<FinanzasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanzasComponent],
      // Rutas vacías: RouterLink necesita el router y '**' absorbe navegaciones como /login.
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(FinanzasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
