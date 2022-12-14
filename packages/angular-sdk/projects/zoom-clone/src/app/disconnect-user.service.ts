import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivate } from '@angular/router';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { UserInput } from '@stream-io/video-client';
import { take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DisconnectUserService implements CanActivate {
  constructor(
    private videoService: StreamVideoService,
    private snackBar: MatSnackBar,
  ) {}

  async canActivate() {
    let user: UserInput | undefined;
    this.videoService.user$.pipe(take(1)).subscribe((u) => (user = u));
    if (user) {
      try {
        await this.videoService.videoClient?.disconnect();
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
