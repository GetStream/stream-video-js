import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { UserInput } from '@stream-io/video-client';
import { environment } from 'projects/sample-app/src/environments/environment';
import { Observable } from 'rxjs';

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
  ) {
    const apiKey = environment.apiKey;
    const token = environment.token;
    const baseCoordinatorUrl = environment.coordinatorUrl;
    const baseWsUrl = environment.wsUrl;
    this.streamVideoService.init(apiKey, token, baseCoordinatorUrl, baseWsUrl);
    this.connectedUser$ = this.streamVideoService.user$;
  }

  disconnect() {
    this.router.navigateByUrl('user-selector');
  }
}
