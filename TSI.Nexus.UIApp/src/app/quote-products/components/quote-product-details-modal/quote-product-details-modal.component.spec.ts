import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuoteProductDetailsModalComponent } from './quote-product-details-modal.component';

describe('QuoteProductDetailsModalComponent', () => {
  let component: QuoteProductDetailsModalComponent;
  let fixture: ComponentFixture<QuoteProductDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [QuoteProductDetailsModalComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(QuoteProductDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
