import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CallParticipantsScreenshareComponent } from './call-participants-screenshare.component';

describe('CallParticipantsScreenshareViewComponent', () => {
  let component: CallParticipantsScreenshareComponent;
  let fixture: ComponentFixture<CallParticipantsScreenshareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CallParticipantsScreenshareComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CallParticipantsScreenshareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
