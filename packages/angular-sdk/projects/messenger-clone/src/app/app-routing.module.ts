import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { ConnectUserService } from './connect-user.service';
import { DisconnectUserService } from './disconnect-user.service';
import { UserSelectorComponent } from './user-selector/user-selector.component';

const routes: Routes = [
  {
    path: 'user-selector',
    component: UserSelectorComponent,
    canActivate: [DisconnectUserService],
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [ConnectUserService],
  },
  { path: '', pathMatch: 'full', redirectTo: 'user-selector' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
