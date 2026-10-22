import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LibroMayorComponent } from './libro-mayor';

describe('LibroMayor', () => {
  let component: LibroMayorComponent;
  let fixture: ComponentFixture<LibroMayorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibroMayorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LibroMayorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
