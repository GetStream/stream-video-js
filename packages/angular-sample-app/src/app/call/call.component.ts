import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CallService } from '../call.service';
import { CallParticipant } from '../types';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss']
})
export class CallComponent implements OnInit {
  participants$: Observable<CallParticipant[]>

  constructor(private callService: CallService) {
    this.participants$ = this.callService.participants$;
  }

  ngOnInit(): void {
  }

}
