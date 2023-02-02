import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleAudioComponent } from './toggle-audio.component';

describe('ToggleAudioComponent', () => {
  let component: ToggleAudioComponent;
  let fixture: ComponentFixture<ToggleAudioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToggleAudioComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToggleAudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
