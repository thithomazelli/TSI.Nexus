import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttachmentDetailsModalComponent } from './attachment-details-modal.component';

describe('AttachmentDetailsModalComponent', () => {
  let component: AttachmentDetailsModalComponent;
  let fixture: ComponentFixture<AttachmentDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AttachmentDetailsModalComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(AttachmentDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
