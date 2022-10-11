import { TestBed } from '@angular/core/testing';

import { StreamVideoService } from './stream-video.service';

describe('StreamVideoService', () => {
  let service: StreamVideoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StreamVideoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
