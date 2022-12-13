import { TestBed } from '@angular/core/testing';

import { DisconnectUserService } from './disconnect-user.service';

describe('DisconnectUserService', () => {
  let service: DisconnectUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DisconnectUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
