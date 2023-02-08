import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleParticipantListComponent } from './toggle-participant-list.component';

describe('ToggleParticipantListComponent', () => {
  let component: ToggleParticipantListComponent;
  let fixture: ComponentFixture<ToggleParticipantListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToggleParticipantListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToggleParticipantListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
