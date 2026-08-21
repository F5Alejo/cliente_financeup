import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InversionesComponent } from './inversiones';

describe('Inversiones', () => {
  let component: InversionesComponent;
  let fixture: ComponentFixture<InversionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InversionesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InversionesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
