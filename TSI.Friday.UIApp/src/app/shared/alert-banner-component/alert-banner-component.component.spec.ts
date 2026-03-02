import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertBannerComponentComponent } from './alert-banner-component.component';

describe('AlertBannerComponentComponent', () => {
  let component: AlertBannerComponentComponent;
  let fixture: ComponentFixture<AlertBannerComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AlertBannerComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertBannerComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
