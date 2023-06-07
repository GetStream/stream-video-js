import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { BehaviorSubject, take } from 'rxjs';
import { ChatClientService } from 'stream-chat-angular';
import { environment } from '../environments/environment';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class ConnectUserService implements CanActivate {
  isConnecting$ = new BehaviorSubject(false);

  constructor(
    private videoService: StreamVideoService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar,
    private chatClientService: ChatClientService,
  ) {}

  async canActivate(route: ActivatedRouteSnapshot) {
    this.isConnecting$.next(true);
    const user = this.userService.users.find(
      (u) => u.user.id === this.userService.selectedUserId,
    );
    if (!user) {
      this.router.navigate(['user-selector'], {
        queryParams: route.queryParams,
      });
      this.isConnecting$.next(false);
      return false;
    } else {
      let connectedUser;
      this.videoService.user$
        .pipe(take(1))
        .subscribe((u) => (connectedUser = u));
      if (connectedUser) {
        this.isConnecting$.next(false);
        return true;
      } else {
        try {
          const apiKey = environment.apiKey;
          this.videoService.init(apiKey);
          await this.videoService.videoClient?.connectUser(
            user.user,
            user.token,
          );
          await this.chatClientService.init(
            environment.apiKey,
            `${user.user.id}`,
            user.token,
          );
          this.isConnecting$.next(false);
          return true;
        } catch (err) {
          console.error(err);
          this.snackBar.open(`Couldn't connect with user: ${user.user.name}`);
          this.router.navigate(['user-selector'], {
            queryParams: route.queryParams,
          });
          this.isConnecting$.next(false);
          return false;
        }
      }
    }
  }
}
