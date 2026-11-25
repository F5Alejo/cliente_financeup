import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LibroMayorComponent } from './libro-mayor';

describe('LibroMayor', () => {
  let component: LibroMayorComponent;
  let fixture: ComponentFixture<LibroMayorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibroMayorComponent],
      // Rutas vacías: RouterLink necesita el router y '**' absorbe navegaciones como /login.
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(LibroMayorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
