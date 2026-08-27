import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResuelveDeudaComponent } from './resuelve-deuda';

describe('ResuelveDeudaComponent', () => {
  let component: ResuelveDeudaComponent;
  let fixture: ComponentFixture<ResuelveDeudaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResuelveDeudaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResuelveDeudaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
