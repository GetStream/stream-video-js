import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallParticipantsViewComponent } from './call-participants.component';

describe('CallParticipantsViewComponent', () => {
  let component: CallParticipantsViewComponent;
  let fixture: ComponentFixture<CallParticipantsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CallParticipantsViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CallParticipantsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
