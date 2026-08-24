import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkFieldComponent } from './link-field.component';

describe('LinkFieldComponent', () => {
  let component: LinkFieldComponent;
  let fixture: ComponentFixture<LinkFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [LinkFieldComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(LinkFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
