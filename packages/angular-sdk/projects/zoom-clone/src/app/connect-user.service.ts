import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivate, Router } from '@angular/router';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { environment } from 'projects/sample-app/src/environments/environment';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class ConnectUserService implements CanActivate {
  constructor(
    private videoService: StreamVideoService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  async canActivate() {
    const user = this.userService.users.find(
      (u) => u.user.id === this.userService.selectedUserId,
    );
    if (!user) {
      this.router.navigateByUrl('user-selector');
      return false;
    } else {
      try {
        await this.videoService.videoClient?.connect(
          environment.apiKey,
          user.token,
          user.user,
        );
        return true;
      } catch (err) {
        this.snackBar.open(`Couldn't connect with user: ${user.user.name}`);
        this.router.navigateByUrl('user-selector');
        return false;
      }
    }
  }
}
