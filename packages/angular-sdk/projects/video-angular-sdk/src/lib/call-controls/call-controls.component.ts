import { Component, Input, OnInit } from '@angular/core';
import { StreamVideoParticipant, Call } from '@stream-io/video-client';

@Component({
  selector: 'stream-call-controls',
  templateUrl: './call-controls.component.html',
  styles: [],
})
export class CallControlsComponent implements OnInit {
  @Input() localParticipant?: StreamVideoParticipant;
  @Input() call?: Call;

  ngOnInit(): void {}

  updateAudioMutaState() {
    console.warn(this.call, !this.localParticipant?.audio);
    this.call?.updateMuteState('audio', !!this.localParticipant?.audio);
  }

  updateVideoMutaState() {
    this.call?.updateMuteState('video', !!this.localParticipant?.video);
  }

  endCall() {
    this.call?.leave();
  }
}
