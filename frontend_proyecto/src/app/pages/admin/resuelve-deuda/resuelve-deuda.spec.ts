import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminResuelveDeudaComponent } from './resuelve-deuda';

describe('AdminResuelveDeudaComponent', () => {
  let component: AdminResuelveDeudaComponent;
  let fixture: ComponentFixture<AdminResuelveDeudaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminResuelveDeudaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminResuelveDeudaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
