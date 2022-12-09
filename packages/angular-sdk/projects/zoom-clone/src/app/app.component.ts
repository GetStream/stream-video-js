import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { Call, UserInput } from '@stream-io/video-client';
import { Observable, take } from 'rxjs';
import { DeviceManagerService } from './device-manager.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  connectedUser$: Observable<UserInput | undefined>;

  constructor(
    private streamVideoService: StreamVideoService,
    private router: Router,
    private snackBar: MatSnackBar,
    private deviceManagerService: DeviceManagerService,
  ) {
    this.connectedUser$ = this.streamVideoService.user$;
    this.deviceManagerService.audioErrorMessage$.subscribe((e) => {
      if (e) {
        this.snackBar.open(e);
      }
    });
    this.deviceManagerService.videoErrorMessage$.subscribe((e) => {
      if (e) {
        this.snackBar.open(e);
      }
    });
  }

  disconnect() {
    let activeCall: Call | undefined;
    this.streamVideoService.activeCall$
      .pipe(take(1))
      .subscribe((c) => (activeCall = c));
    if (activeCall) {
      activeCall.leave();
    }
    this.router.navigateByUrl('user-selector');
  }
}
