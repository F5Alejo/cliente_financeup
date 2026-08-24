import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerCookiesComponent } from './banner-cookies';

describe('BannerCookiesComponent', () => {
  let component: BannerCookiesComponent;
  let fixture: ComponentFixture<BannerCookiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerCookiesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BannerCookiesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
