import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EndCallComponent } from './end-call.component';

describe('EndCallComponent', () => {
  let component: EndCallComponent;
  let fixture: ComponentFixture<EndCallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EndCallComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EndCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
