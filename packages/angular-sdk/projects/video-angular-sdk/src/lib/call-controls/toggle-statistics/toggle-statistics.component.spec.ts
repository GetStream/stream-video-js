import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleStatisticsComponent } from './toggle-statistics.component';

describe('ToggleStatisticsComponent', () => {
  let component: ToggleStatisticsComponent;
  let fixture: ComponentFixture<ToggleStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToggleStatisticsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
