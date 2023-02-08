import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CallComponent } from './call/call.component';
import { ParticipantComponent } from './participant/participant.component';
import { CallControlsComponent } from './call-controls/call-controls.component';
import { StageComponent } from './stage/stage.component';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { CallStatisticsComponent } from './call-statistics/call-statistics.component';
import { NgChartsModule } from 'ng2-charts';
import { ToggleRecordingComponent } from './call-controls/toggle-recording/toggle-recording.component';
import { ToggleAudioComponent } from './call-controls/toggle-audio/toggle-audio.component';
import { ToggleVideoComponent } from './call-controls/toggle-video/toggle-video.component';
import { ToggleScreenshareComponent } from './call-controls/toggle-screenshare/toggle-screenshare.component';
import { EndCallComponent } from './call-controls/end-call/end-call.component';
import { ToggleStatisticsComponent } from './call-controls/toggle-statistics/toggle-statistics.component';
import { DeviceSettingsComponent } from './call-controls/device-settings/device-settings.component';
import { CallParticipantsComponent } from './call-participants/call-participants.component';
import { CallParticipantsScreenshareComponent } from './call-participants-screenshare/call-participants-screenshare.component';
import { CallParticipantListComponent } from './call-participant-list/call-participant-list.component';
import { ToggleParticipantListComponent } from './call-controls/toggle-participant-list/toggle-participant-list.component';

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
    ToggleRecordingComponent,
    ToggleAudioComponent,
    ToggleVideoComponent,
    ToggleScreenshareComponent,
    EndCallComponent,
    ToggleStatisticsComponent,
    CallParticipantListComponent,
    ToggleParticipantListComponent,
  ],
  imports: [CommonModule, NgxPopperjsModule, NgChartsModule],
  exports: [
    CallComponent,
    ParticipantComponent,
    CallControlsComponent,
    StageComponent,
    DeviceSettingsComponent,
    CallStatisticsComponent,
    CallParticipantsComponent,
    CallParticipantsScreenshareComponent,
    ToggleRecordingComponent,
    ToggleAudioComponent,
    ToggleVideoComponent,
    ToggleScreenshareComponent,
    EndCallComponent,
    ToggleStatisticsComponent,
    CallParticipantListComponent,
    ToggleParticipantListComponent,
  ],
})
export class StreamVideoModule {}
