import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InversionesComponent } from './inversiones';


describe('Inversiones', () => {
  let component: InversionesComponent;
  let fixture: ComponentFixture<InversionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InversionesComponent],
      // Rutas vacías: RouterLink necesita el router y '**' absorbe navegaciones como /login.
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(InversionesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
