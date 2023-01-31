import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-profile-picture',
  templateUrl: './profile-picture.component.html',
  styleUrls: ['./profile-picture.component.scss'],
})
export class ProfilePictureComponent implements OnInit {
  @Input() url?: string;
  @Input() name?: string;

  ngOnInit(): void {}

  get initials() {
    if (!this.name) {
      return '';
    }
    const words = this.name.split(' ');
    return words.map((w) => w.charAt(0).toUpperCase()).join('');
  }
}
