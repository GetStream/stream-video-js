import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallParticipantListComponent } from './call-participant-list.component';

describe('CallParticipantListComponent', () => {
  let component: CallParticipantListComponent;
  let fixture: ComponentFixture<CallParticipantListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CallParticipantListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CallParticipantListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
