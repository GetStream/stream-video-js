import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { environment } from 'projects/sample-app/src/environments/environment';
import { take } from 'rxjs';
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

  async canActivate(route: ActivatedRouteSnapshot) {
    const user = this.userService.users.find(
      (u) => u.user.id === this.userService.selectedUserId,
    );
    if (!user) {
      this.router.navigate(['user-selector'], {
        queryParams: route.queryParams,
      });
      return false;
    } else {
      let connectedUser;
      this.videoService.user$
        .pipe(take(1))
        .subscribe((u) => (connectedUser = u));
      if (connectedUser) {
        return true;
      } else {
        try {
          const apiKey = environment.apiKey;
          const token = user.token;
          const baseCoordinatorUrl = environment.coordinatorUrl;
          const baseWsUrl = environment.wsUrl;
          this.videoService.init(apiKey, token, baseCoordinatorUrl, baseWsUrl);
          await this.videoService.videoClient?.connect(
            environment.apiKey,
            user.token,
            user.user,
          );
          return true;
        } catch (err) {
          this.snackBar.open(`Couldn't connect with user: ${user.user.name}`);
          this.router.navigate(['user-selector'], {
            queryParams: route.queryParams,
          });
          return false;
        }
      }
    }
  }
}
