import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BannerCookiesComponent } from './banner-cookies';

describe('BannerCookiesComponent', () => {
  let component: BannerCookiesComponent;
  let fixture: ComponentFixture<BannerCookiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerCookiesComponent],
      // RouterLink del enlace a la política necesita el router
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(BannerCookiesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
