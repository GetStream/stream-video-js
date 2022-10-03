import { Component, Input, OnInit } from '@angular/core';
import { CallParticipant } from '../types';

@Component({
  selector: 'app-participant',
  templateUrl: './participant.component.html',
  styleUrls: ['./participant.component.scss']
})
export class ParticipantComponent implements OnInit {
  @Input() participant?: CallParticipant;

  constructor() { }

  ngOnInit(): void {
  }

}
