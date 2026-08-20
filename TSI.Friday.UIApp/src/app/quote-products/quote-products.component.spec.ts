import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuoteProductsComponent } from './quote-products.component';

describe('QuoteProductsComponent', () => {
  let component: QuoteProductsComponent;
  let fixture: ComponentFixture<QuoteProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [QuoteProductsComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(QuoteProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
