import { NgModule } from '@angular/core';
import { CallComponent } from './call/call.component';
import { ParticipantComponent } from './participant/participant.component';
import { AsyncPipe, KeyValuePipe } from '@angular/common';

@NgModule({
  declarations: [CallComponent, ParticipantComponent],
  imports: [KeyValuePipe, AsyncPipe],
  exports: [CallComponent, ParticipantComponent],
})
export class StreamVideoModule {}
