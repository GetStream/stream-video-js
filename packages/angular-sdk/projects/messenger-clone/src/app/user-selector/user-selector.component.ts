import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConnectUserService } from '../connect-user.service';
import { UserSelectionItem, UserService } from '../user.service';

@Component({
  selector: 'app-user-selector',
  templateUrl: './user-selector.component.html',
  styleUrls: ['./user-selector.component.scss'],
})
export class UserSelectorComponent implements OnInit, OnDestroy {
  users: UserSelectionItem[];
  isConnecting = false;
  selectedUserId?: string;
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private userService: UserService,
    private route: ActivatedRoute,
    private connectUserService: ConnectUserService,
  ) {
    this.users = this.userService.users;
    this.subscriptions.push(
      this.connectUserService.isConnecting$.subscribe((isConnecting) => {
        this.isConnecting = isConnecting;
      }),
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  userSelected(userId: string) {
    this.selectedUserId = userId;
    this.userService.selectedUserId = userId;
    this.router.navigate(['chat'], {
      queryParams: this.route.snapshot.queryParams,
    });
  }
}
