import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DeviceManagerService,
  StreamVideoService,
} from '@stream-io/video-angular-sdk';
import { Subscription } from 'rxjs';
import { ChatClientService, getChannelDisplayText } from 'stream-chat-angular';
import { CallMetadata } from '@stream-io/video-client';

@Component({
  selector: 'app-incoming-call',
  templateUrl: './incoming-call.component.html',
  styleUrls: ['./incoming-call.component.scss'],
})
export class IncomingCallComponent implements OnInit, OnDestroy {
  isAcceptInProgress = false;
  isRejectInProgress = false;
  channelName?: string;
  private subscripitions: Subscription[] = [];

  constructor(
    private streamVideoService: StreamVideoService,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    @Inject(MAT_DIALOG_DATA) public data: CallMetadata,
    private matDialogRef: MatDialogRef<any>,
    private deviceManager: DeviceManagerService,
    private chatClientService: ChatClientService,
  ) {
    const channelId = this.data.call.custom?.['channelId'];
    this.chatClientService.chatClient
      .queryChannels({ id: channelId }, undefined, { watch: false })
      .then((response) => {
        const channel = response[0];
        this.channelName = getChannelDisplayText(
          channel,
          this.chatClientService.chatClient.user!,
        );
      });
    this.subscripitions.push(
      this.streamVideoService.incomingCalls$.subscribe((calls) => {
        // TODO: state store shortcoming: we don't know if incoming call was removed because we accepted it or because it was cancelled
        if (
          !calls.find((c) => c.call?.id === this.data.call?.id) &&
          !this.isAcceptInProgress
        ) {
          this.matDialogRef.close();
          this.deviceManager.stopAudio();
          this.deviceManager.stopVideo();
        }
      }),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscripitions.forEach((s) => s.unsubscribe());
  }

  async acceptCall() {
    this.isAcceptInProgress = true;
    try {
      await this.ngZone.runOutsideAngular(async () => {
        await this.streamVideoService.videoClient?.acceptCall(
          this.data.call.id,
          this.data.call.type,
        );
      });
      this.matDialogRef.close();
      this.isAcceptInProgress = false;
    } catch (err: any) {
      this.snackBar.open(`Can't accept call, ${err.message}`, 'OK');
      this.isAcceptInProgress = false;
    }
  }

  async rejectCall() {
    this.isRejectInProgress = true;
    try {
      await this.streamVideoService.videoClient?.rejectCall(
        this.data.call.id,
        this.data.call.type,
      );
      this.matDialogRef.close();
      this.deviceManager.stopVideo();
      this.deviceManager.stopAudio();
      this.isRejectInProgress = false;
    } catch (err: any) {
      this.snackBar.open(`Can't reject call, ${err.message}`, 'OK');
      this.isRejectInProgress = false;
    }
  }
}
