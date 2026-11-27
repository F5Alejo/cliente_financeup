import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { VerPqrComponent } from './ver-pqr';

describe('VerPqrComponent', () => {
  let component: VerPqrComponent;
  let fixture: ComponentFixture<VerPqrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerPqrComponent],
      // Rutas vacías: RouterLink necesita el router y '**' absorbe navegaciones como /login.
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(VerPqrComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
