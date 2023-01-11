import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {
  StreamVideoService,
  DeviceManagerService,
} from '@stream-io/video-angular-sdk';
import { Call, UserInput } from '@stream-io/video-client';
import { Observable, take } from 'rxjs';
import { StreamI18nService, ThemeService } from 'stream-chat-angular';

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
    private streamI18nService: StreamI18nService,
    private themeService: ThemeService,
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
    this.streamI18nService.setTranslation();
    this.themeService.theme$.next('dark');
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
