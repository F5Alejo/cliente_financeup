import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLibroMayorComponent } from './libro-mayor';

describe('AdminLibroMayorComponent', () => {
  let component: AdminLibroMayorComponent;
  let fixture: ComponentFixture<AdminLibroMayorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLibroMayorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLibroMayorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
