import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleRecordingComponent } from './toggle-recording.component';

describe('ToggleRecordingComponent', () => {
  let component: ToggleRecordingComponent;
  let fixture: ComponentFixture<ToggleRecordingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToggleRecordingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleRecordingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
