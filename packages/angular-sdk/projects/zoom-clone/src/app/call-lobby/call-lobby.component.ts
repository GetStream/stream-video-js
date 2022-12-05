import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getAudioStream, getVideoStream } from '@stream-io/video-client';

@Component({
  selector: 'app-call-lobby',
  templateUrl: './call-lobby.component.html',
  styleUrls: ['./call-lobby.component.scss'],
})
export class CallLobbyComponent implements OnInit {
  videoStream?: MediaStream;
  cameraState: 'loading' | 'on' | 'off' | 'error' = 'loading';
  cameraErrorMessage?: string;
  audioStream?: MediaStream;
  audioState: 'loading' | 'on' | 'off' | 'error' = 'loading';
  audioErrorMessage?: string;
  constructor(private snackBar: MatSnackBar) {
    getVideoStream()
      .then((s) => {
        this.videoStream = s;
        this.cameraState = 'on';
      })
      .catch((err) => {
        if (err.code === 0) {
          this.cameraErrorMessage = 'Permission denied for camera access';
        } else {
          this.cameraErrorMessage = `Video stream couldn't be started`;
        }
        this.cameraState = 'error';
        this.snackBar.open(this.cameraErrorMessage);
      });
    getAudioStream()
      .then((s) => {
        this.audioStream = s;
        this.audioState = 'on';
      })
      .catch((err) => {
        if (err.code === 0) {
          this.audioErrorMessage = 'Permission denied for camera access';
        } else {
          this.audioErrorMessage = `Video stream couldn't be started`;
        }
        this.audioState = 'error';
        this.snackBar.open(this.audioErrorMessage);
      });
  }

  ngOnInit(): void {}
}
