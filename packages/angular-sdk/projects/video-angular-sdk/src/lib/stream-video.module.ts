import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CallComponent } from './call/call.component';
import { ParticipantComponent } from './participant/participant.component';
import { CallControlsComponent } from './call-controls/call-controls.component';

@NgModule({
  declarations: [CallComponent, ParticipantComponent, CallControlsComponent],
  imports: [CommonModule],
  exports: [CallComponent, ParticipantComponent, CallControlsComponent],
})
export class StreamVideoModule {}
