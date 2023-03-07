import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivate } from '@angular/router';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { User } from '@stream-io/video-client';
import { take } from 'rxjs';
import { ChannelService, ChatClientService } from 'stream-chat-angular';

@Injectable({
  providedIn: 'root',
})
export class DisconnectUserService implements CanActivate {
  constructor(
    private videoService: StreamVideoService,
    private snackBar: MatSnackBar,
    private chatClientService: ChatClientService,
    private channelService: ChannelService,
  ) {}

  async canActivate() {
    let user: User | undefined;
    this.videoService.user$.pipe(take(1)).subscribe((u) => (user = u));
    if (user) {
      try {
        await this.videoService.videoClient?.disconnectUser();
        this.channelService.reset();
        await this.chatClientService.disconnectUser();
        return true;
      } catch (err) {
        this.snackBar.open(`Couldn't disconnect user`);
        return false;
      }
    } else {
      return true;
    }
  }
}
