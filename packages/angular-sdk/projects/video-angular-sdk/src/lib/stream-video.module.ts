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
import {
  CallParticipantsComponent,
  CallParticipantsScreenshareComponent,
} from '../public-api';

/**
 * This Angular Module is the entry point of the SDK, import this Angular module in your application, all services and UI components defined by the SDK belong to this module.
 */
@NgModule({
  declarations: [
    CallComponent,
    ParticipantComponent,
    CallControlsComponent,
    StageComponent,
    DeviceSettingsComponent,
    CallStatisticsComponent,
    CallParticipantsComponent,
    CallParticipantsScreenshareComponent,
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
