import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { map, Observable, throttleTime } from 'rxjs';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-autocomplete',
  templateUrl: './user-autocomplete.component.html',
  styleUrls: ['./user-autocomplete.component.scss'],
})
export class UserAutocompleteComponent implements OnInit {
  userSearchControl = new FormControl('');
  filteredOptions: Observable<string[]>;
  @Output() userSelect = new EventEmitter<string | undefined>();

  constructor(private userService: UserService) {
    this.filteredOptions = this.userSearchControl.valueChanges.pipe(
      throttleTime(500),
      map((value) =>
        (value
          ? this.userService.users.filter((u) =>
              u.user.name.toLowerCase().includes(value.toLowerCase()),
            )
          : []
        ).map((u) => u.user.name),
      ),
    );
  }

  ngOnInit(): void {}

  optionSelected(event: MatAutocompleteSelectedEvent) {
    const value = event.option.value;
    const userId = this.userService.users.find((u) => u.user.name === value)
      ?.user?.id;
    if (userId) {
      this.userSelect.emit(userId);
    }
  }

  searchCleared() {
    this.userSearchControl.reset();
    this.userSelect.emit(undefined);
  }
}
