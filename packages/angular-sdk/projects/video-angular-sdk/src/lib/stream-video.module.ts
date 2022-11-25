import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CallComponent } from './call/call.component';
import { ParticipantComponent } from './participant/participant.component';
import { CallControlsComponent } from './call-controls/call-controls.component';
import { StageComponent } from './stage/stage.component';
import { DeviceSettingsComponent } from './device-settings/device-settings.component';
import { NgxPopperjsModule } from 'ngx-popperjs';

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
  ],
  imports: [CommonModule, NgxPopperjsModule],
  exports: [
    CallComponent,
    ParticipantComponent,
    CallControlsComponent,
    StageComponent,
    DeviceSettingsComponent,
  ],
})
export class StreamVideoModule {}
