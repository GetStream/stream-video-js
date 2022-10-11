import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { VideoDimension } from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { Observable } from 'rxjs';
import { CallService } from '../call.service';
import { CallParticipant } from '../types';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
})
export class CallComponent implements OnInit, AfterViewChecked {
  participants$: Observable<CallParticipant[]>;

  constructor(private callService: CallService) {
    this.participants$ = this.callService.participants$;
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    console.log('change detector ran');
  }

  updateParticipantVideoDimensions(
    videoDimension: VideoDimension,
    name: string,
  ) {
    this.callService.updateVideoDimensionOfCallParticipants([
      { videoDimension, name },
    ]);
  }

  trackByParticipantName(_: number, item: CallParticipant) {
    return item.name;
  }
}
