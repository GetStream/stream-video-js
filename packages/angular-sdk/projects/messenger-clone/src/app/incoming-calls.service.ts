import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { IncomingCallComponent } from './incoming-call/incoming-call.component';

@Injectable({
  providedIn: 'root',
})
export class IncomingCallsService {
  private isDialogOpen$ = new BehaviorSubject(false);
  private activeDialog?: MatDialogRef<any>;
  private subscription?: Subscription;

  constructor(
    private videoService: StreamVideoService,
    private dialog: MatDialog,
  ) {}

  startWatchingForIncomingCalls() {
    this.subscription = combineLatest([
      this.videoService.incomingCalls$,
      this.isDialogOpen$,
    ]).subscribe(([calls, isDialogOpen]) => {
      if (calls.length > 0 && !isDialogOpen) {
        this.activeDialog = this.dialog.open(IncomingCallComponent);
        this.isDialogOpen$.next(true);
        this.activeDialog.afterClosed().subscribe(() => {
          this.activeDialog = undefined;
          this.isDialogOpen$.next(false);
        });
      }
    });
  }

  stopWatchingForIncomingCalls() {
    this.subscription?.unsubscribe();
    this.dismissIncomingCallDialog();
  }

  dismissIncomingCallDialog() {
    this.activeDialog?.close();
  }
}
