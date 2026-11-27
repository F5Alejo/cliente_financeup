import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HablaConNosotrosComponent } from './habla-con-nosotros';

describe('HablaConNosotros', () => {
  let component: HablaConNosotrosComponent;
  let fixture: ComponentFixture<HablaConNosotrosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HablaConNosotrosComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HablaConNosotrosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
