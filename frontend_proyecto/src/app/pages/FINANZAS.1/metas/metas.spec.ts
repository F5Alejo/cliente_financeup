import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetasComponent } from './metas';

describe('Metas', () => {
  let component: MetasComponent;
  let fixture: ComponentFixture<MetasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
