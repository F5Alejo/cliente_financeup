import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevoPqr } from './nuevo-pqr';

describe('NuevoPqr', () => {
  let component: NuevoPqr;
  let fixture: ComponentFixture<NuevoPqr>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoPqr],
    }).compileComponents();

    fixture = TestBed.createComponent(NuevoPqr);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
