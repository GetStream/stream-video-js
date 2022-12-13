import { TestBed } from '@angular/core/testing';

import { InCallDeviceManagerService } from './in-call-device-manager.service';

describe('InCallDeviceManagerService', () => {
  let service: InCallDeviceManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InCallDeviceManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
