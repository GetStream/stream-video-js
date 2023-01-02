import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CallComponent } from './call/call.component';
import { ParticipantComponent } from './participant/participant.component';
import { CallControlsComponent } from './call-controls/call-controls.component';
import { StageComponent } from './stage/stage.component';
import { DeviceSettingsComponent } from './device-settings/device-settings.component';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { CallStatisticsComponent } from './call-statistics/call-statistics.component';
import { NgChartsModule } from 'ng2-charts';
import { CallParticipantsViewComponent } from './call-participants-view/call-participants-view.component';
import { CallParticipantsScreenshareViewComponent } from './call-participants-screenshare-view/call-participants-screenshare-view.component';

/**
 * This Angular Module is the entry point of the SDK, import this Angular module in your application, all services defined by the SDK are created by importing this module
 */
@NgModule({
  declarations: [
    CallComponent,
    ParticipantComponent,
    CallControlsComponent,
    StageComponent,
    DeviceSettingsComponent,
    CallStatisticsComponent,
    CallParticipantsViewComponent,
    CallParticipantsScreenshareViewComponent,
  ],
  imports: [CommonModule, NgxPopperjsModule, NgChartsModule],
  exports: [
    CallComponent,
    ParticipantComponent,
    CallControlsComponent,
    StageComponent,
    DeviceSettingsComponent,
  ],
})
export class StreamVideoModule {}
