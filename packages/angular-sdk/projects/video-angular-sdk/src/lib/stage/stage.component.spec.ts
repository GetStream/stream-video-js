import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageComponent } from './stage.component';

describe('StageComponent', () => {
  let component: StageComponent;
  let fixture: ComponentFixture<StageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
