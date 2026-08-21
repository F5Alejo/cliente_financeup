import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerCookies } from './banner-cookies';

describe('BannerCookies', () => {
  let component: BannerCookies;
  let fixture: ComponentFixture<BannerCookies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerCookies],
    }).compileComponents();

    fixture = TestBed.createComponent(BannerCookies);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
