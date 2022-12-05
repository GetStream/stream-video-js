import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserSelectionItem, UserService } from '../user.service';

@Component({
  selector: 'app-user-selector',
  templateUrl: './user-selector.component.html',
  styleUrls: ['./user-selector.component.scss'],
})
export class UserSelectorComponent implements OnInit {
  users: UserSelectionItem[];

  constructor(private router: Router, private userService: UserService) {
    this.users = this.userService.users;
  }

  ngOnInit(): void {}

  userSelected(userId: string) {
    this.userService.selectedUserId = userId;
    this.router.navigateByUrl('/call-lobby');
  }
}
