import { Component } from '@angular/core';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { environment } from 'projects/sample-app/src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(private streamVideoService: StreamVideoService) {
    const apiKey = environment.apiKey;
    const token = environment.token;
    const baseCoordinatorUrl = environment.coordinatorUrl;
    const baseWsUrl = environment.wsUrl;
    this.streamVideoService.init(apiKey, token, baseCoordinatorUrl, baseWsUrl);
  }
}
