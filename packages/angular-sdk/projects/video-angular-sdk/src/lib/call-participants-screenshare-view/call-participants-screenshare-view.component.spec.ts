import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallParticipantsScreenshareViewComponent } from './call-participants-screenshare-view.component';

describe('CallParticipantsScreenshareViewComponent', () => {
  let component: CallParticipantsScreenshareViewComponent;
  let fixture: ComponentFixture<CallParticipantsScreenshareViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CallParticipantsScreenshareViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CallParticipantsScreenshareViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
