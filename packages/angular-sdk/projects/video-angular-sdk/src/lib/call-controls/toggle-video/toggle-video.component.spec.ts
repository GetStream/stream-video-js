import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleVideoComponent } from './toggle-video.component';

describe('ToggleVideoComponent', () => {
  let component: ToggleVideoComponent;
  let fixture: ComponentFixture<ToggleVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToggleVideoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
