import { Component, Inject, NgZone, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DeviceManagerService,
  StreamVideoService,
} from '@stream-io/video-angular-sdk';
import { CallMeta } from '@stream-io/video-client';
import { Subscription } from 'rxjs';
import { ChatClientService, getChannelDisplayText } from 'stream-chat-angular';

@Component({
  selector: 'app-outgoing-call',
  templateUrl: './outgoing-call.component.html',
  styleUrls: ['./outgoing-call.component.scss'],
})
export class OutgoingCallComponent implements OnInit {
  isCancelInProgress = false;
  isJoinInProgress = false;
  isJoined = false;
  channelName?: string;
  private subscripitions: Subscription[] = [];

  constructor(
    private streamVideoService: StreamVideoService,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    @Inject(MAT_DIALOG_DATA) public data: CallMeta.Call,
    private matDialogRef: MatDialogRef<any>,
    private deviceManager: DeviceManagerService,
    private chatClientService: ChatClientService,
  ) {
    const channelId = JSON.parse(
      new TextDecoder().decode(this.data?.customJson),
    ).channelId;
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
      this.streamVideoService.acceptedCall$.subscribe((call) => {
        if (call?.call_cid === this.data.id) {
          this.joinCall();
        }
      }),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscripitions.forEach((s) => s.unsubscribe());
  }

  async cancelCall() {
    this.isCancelInProgress = true;
    try {
      await this.ngZone.runOutsideAngular(async () => {
        await this.streamVideoService.videoClient?.cancelCall(
          this.data.callCid,
        );
      });
      this.matDialogRef.close();
      this.deviceManager.stopAudio();
      this.deviceManager.stopVideo();
      this.isCancelInProgress = false;
    } catch (err: any) {
      this.snackBar.open(`Can't cancel call, ${err.message}`, 'OK');
      this.isCancelInProgress = false;
    }
  }

  async joinCall() {
    this.isJoinInProgress = true;
    try {
      await this.ngZone.runOutsideAngular(async () => {
        await this.streamVideoService.videoClient?.joinCall(
          this.data.id,
          'default',
        );
      });
      this.isJoinInProgress = false;
      this.matDialogRef.close();
    } catch (err: any) {
      this.isJoinInProgress = false;
      this.snackBar.open(`Can't join call, ${err.message}`, 'OK');
    }
  }
}
