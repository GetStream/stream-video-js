import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleScreenshareComponent } from './toggle-screenshare.component';

describe('ToggleScreenshareComponent', () => {
  let component: ToggleScreenshareComponent;
  let fixture: ComponentFixture<ToggleScreenshareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToggleScreenshareComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleScreenshareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
