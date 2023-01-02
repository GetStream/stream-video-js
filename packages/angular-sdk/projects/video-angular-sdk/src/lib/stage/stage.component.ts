import { Component, OnInit } from '@angular/core';
import { StreamVideoService } from '../video.service';

@Component({
  selector: 'stream-stage',
  templateUrl: './stage.component.html',
  styles: [],
})
export class StageComponent implements OnInit {
  constructor(private streamVideoService: StreamVideoService) {}

  ngOnInit(): void {}
}
