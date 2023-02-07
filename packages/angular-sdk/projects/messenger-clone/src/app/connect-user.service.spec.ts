import { TestBed } from '@angular/core/testing';

import { ConnectUserService } from './connect-user.service';

describe('ConnectUserService', () => {
  let service: ConnectUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConnectUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
