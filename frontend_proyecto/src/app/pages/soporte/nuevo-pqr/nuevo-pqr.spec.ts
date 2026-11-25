import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NuevoPqrComponent } from './nuevo-pqr';

describe('NuevoPqrComponent', () => {
  let component: NuevoPqrComponent;
  let fixture: ComponentFixture<NuevoPqrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoPqrComponent],
      // Rutas vacías: RouterLink necesita el router y '**' absorbe navegaciones como /login.
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(NuevoPqrComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
