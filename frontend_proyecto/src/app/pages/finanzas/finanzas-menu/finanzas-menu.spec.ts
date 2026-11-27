import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FinanzasMenuComponent } from './finanzas-menu';

describe('FinanzasMenu', () => {
  let component: FinanzasMenuComponent;
  let fixture: ComponentFixture<FinanzasMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanzasMenuComponent],
      // Rutas vacías: RouterLink necesita el router y '**' absorbe navegaciones como /login.
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(FinanzasMenuComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
