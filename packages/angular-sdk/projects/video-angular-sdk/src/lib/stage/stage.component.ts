import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { StreamVideoService } from '../video.service';

@Component({
  selector: 'stream-stage',
  templateUrl: './stage.component.html',
  styles: [],
})
export class StageComponent implements OnInit {
  hasOngoingScreenshare$: Observable<boolean>;

  constructor(private streamVideoService: StreamVideoService) {
    this.hasOngoingScreenshare$ =
      this.streamVideoService.hasOngoingScreenShare$;
  }

  ngOnInit(): void {}
}
