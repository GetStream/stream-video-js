import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallControlsComponent } from './call-controls.component';

describe('CallControlsComponent', () => {
  let component: CallControlsComponent;
  let fixture: ComponentFixture<CallControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CallControlsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CallControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
