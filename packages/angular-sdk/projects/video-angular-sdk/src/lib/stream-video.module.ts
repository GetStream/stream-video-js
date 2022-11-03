import { NgModule } from '@angular/core';
import { CallComponent } from './call/call.component';
import { ParticipantComponent } from './participant/participant.component';

@NgModule({
  declarations: [CallComponent, ParticipantComponent],
  imports: [],
  exports: [CallComponent, ParticipantComponent],
})
export class StreamVideoModule {}
