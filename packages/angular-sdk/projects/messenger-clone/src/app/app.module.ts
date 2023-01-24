import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UserSelectorComponent } from './user-selector/user-selector.component';
import { StreamVideoModule } from '@stream-io/video-angular-sdk';
import { ProfilePictureComponent } from './profile-picture/profile-picture.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DeviceControlComponent } from './device-control/device-control.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { CallComponent } from './call/call.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TranslateModule } from '@ngx-translate/core';
import {
  StreamAutocompleteTextareaModule,
  StreamChatModule,
} from 'stream-chat-angular';
import { ChatComponent } from './chat/chat.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { UserAutocompleteComponent } from './user-autocomplete/user-autocomplete.component';
import { MatDialogModule } from '@angular/material/dialog';
import { IncomingCallComponent } from './incoming-call/incoming-call.component';

@NgModule({
  declarations: [
    AppComponent,
    UserSelectorComponent,
    ProfilePictureComponent,
    DeviceControlComponent,
    CallComponent,
    ChatComponent,
    UserAutocompleteComponent,
    IncomingCallComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatToolbarModule,
    BrowserAnimationsModule,
    StreamVideoModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSelectModule,
    DragDropModule,
    TranslateModule.forRoot(),
    StreamAutocompleteTextareaModule,
    StreamChatModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDialogModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
