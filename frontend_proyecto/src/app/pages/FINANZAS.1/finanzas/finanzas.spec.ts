import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanzasComponent } from './finanzas';

describe('Finanzas', () => {
  let component: FinanzasComponent;
  let fixture: ComponentFixture<FinanzasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanzasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinanzasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
