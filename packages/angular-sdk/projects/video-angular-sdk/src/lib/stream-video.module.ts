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

@NgModule({
  declarations: [
    CallComponent,
    ParticipantComponent,
    CallControlsComponent,
    StageComponent,
    DeviceSettingsComponent,
    CallStatisticsComponent,
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
