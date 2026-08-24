import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuoteDetailsPageComponent } from './quote-details-page.component';

describe('QuoteDetailsPageComponent', () => {
  let component: QuoteDetailsPageComponent;
  let fixture: ComponentFixture<QuoteDetailsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [QuoteDetailsPageComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(QuoteDetailsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
