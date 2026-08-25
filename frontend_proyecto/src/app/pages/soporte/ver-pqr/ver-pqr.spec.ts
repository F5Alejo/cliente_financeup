import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerPqrComponent } from './ver-pqr';

describe('VerPqrComponent', () => {
  let component: VerPqrComponent;
  let fixture: ComponentFixture<VerPqrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerPqrComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VerPqrComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
