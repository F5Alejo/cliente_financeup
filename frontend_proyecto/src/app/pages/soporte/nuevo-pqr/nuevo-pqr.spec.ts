import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevoPqrComponent } from './nuevo-pqr';

describe('NuevoPqrComponent', () => {
  let component: NuevoPqrComponent;
  let fixture: ComponentFixture<NuevoPqrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoPqrComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NuevoPqrComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
