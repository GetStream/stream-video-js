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
import { IncomingCallsService } from './incoming-calls.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  connectedUser$: Observable<UserInput | undefined>;
  activeCall$: Observable<Call | undefined>;

  constructor(
    private streamVideoService: StreamVideoService,
    private router: Router,
    private snackBar: MatSnackBar,
    private deviceManagerService: DeviceManagerService,
    private streamI18nService: StreamI18nService,
    private themeService: ThemeService,
    private incomingCallsService: IncomingCallsService,
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
    this.incomingCallsService.startWatchingForIncomingCalls();
    this.activeCall$ = this.streamVideoService.activeCall$;
  }

  disconnect() {
    let activeCall: Call | undefined;
    this.streamVideoService.activeCall$
      .pipe(take(1))
      .subscribe((c) => (activeCall = c));
    if (activeCall) {
      activeCall.leave();
    }
    this.incomingCallsService.dismissIncomingCallDialog();
    this.router.navigateByUrl('user-selector');
  }
}
