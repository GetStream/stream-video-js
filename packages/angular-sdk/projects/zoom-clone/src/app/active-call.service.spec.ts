import { TestBed } from '@angular/core/testing';

import { ActiveCallService } from './active-call.service';

describe('ActiveCallService', () => {
  let service: ActiveCallService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActiveCallService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
