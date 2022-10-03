import { TestBed } from '@angular/core/testing';

import { VideoClientService } from './video-client.service';

describe('VideoClientService', () => {
  let service: VideoClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
