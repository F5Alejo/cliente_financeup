import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanzasMenuComponent } from './finanzas-menu';

describe('Sidebar', () => {
  let component: FinanzasMenuComponent;
  let fixture: ComponentFixture<FinanzasMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanzasMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinanzasMenuComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
