import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallStatisticsComponent } from './call-statistics.component';

describe('CallStatisticsComponent', () => {
  let component: CallStatisticsComponent;
  let fixture: ComponentFixture<CallStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CallStatisticsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CallStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
