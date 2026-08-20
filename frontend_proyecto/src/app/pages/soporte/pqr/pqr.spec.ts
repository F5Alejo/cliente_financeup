import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PqrComponent } from './pqr';

describe('Pqr', () => {
  let component: PqrComponent;
  let fixture: ComponentFixture<PqrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PqrComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PqrComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
