import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CallParticipant } from '../types';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
})
export class CallComponent implements OnInit, AfterViewChecked {
  participants$: Observable<CallParticipant[]>;

  constructor() {
    this.participants$ = of([]);
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    console.log('change detector ran');
  }

  trackByParticipantName(_: number, item: CallParticipant) {
    return item.name;
  }
}
