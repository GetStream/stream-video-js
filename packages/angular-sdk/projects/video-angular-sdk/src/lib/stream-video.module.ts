import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CallComponent } from './call/call.component';
import { ParticipantComponent } from './participant/participant.component';
import { CallControlsComponent } from './call-controls/call-controls.component';
import { StageComponent } from './stage/stage.component';

@NgModule({
  declarations: [
    CallComponent,
    ParticipantComponent,
    CallControlsComponent,
    StageComponent,
  ],
  imports: [CommonModule],
  exports: [
    CallComponent,
    ParticipantComponent,
    CallControlsComponent,
    StageComponent,
  ],
})
export class StreamVideoModule {}
