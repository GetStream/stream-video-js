import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteLinkButtonComponent } from './invite-link-button.component';

describe('InviteLinkButtonComponent', () => {
  let component: InviteLinkButtonComponent;
  let fixture: ComponentFixture<InviteLinkButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InviteLinkButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InviteLinkButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
