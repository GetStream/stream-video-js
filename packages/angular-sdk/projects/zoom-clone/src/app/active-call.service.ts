import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { StreamVideoService } from '@stream-io/video-angular-sdk';
import { map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ActiveCallService implements CanActivate {
  constructor(
    private streamVideoService: StreamVideoService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    return this.streamVideoService.activeCall$.pipe(
      tap((c) => {
        if (!c) {
          this.router.navigate(['call-lobby'], {
            queryParams: route.queryParams,
          });
        }
      }),
      map((c) => !!c),
    );
  }
}
