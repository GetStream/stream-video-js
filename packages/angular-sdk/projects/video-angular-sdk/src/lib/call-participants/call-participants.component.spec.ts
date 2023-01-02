import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CallParticipantsComponent } from './call-participants.component';

describe('CallParticipantsViewComponent', () => {
  let component: CallParticipantsComponent;
  let fixture: ComponentFixture<CallParticipantsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CallParticipantsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CallParticipantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
