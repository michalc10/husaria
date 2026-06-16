import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Component({
    selector: 'app-main-layout',
    templateUrl: './main-layout.component.html',
    styleUrls: ['./main-layout.component.scss'],
    standalone: false
})
export class MainLayoutComponent implements OnDestroy {
  isTournamentMode = false;
  private readonly routerSubscription = new Subscription();

  constructor(private router: Router) {
    this.updateLayoutMode(this.router.url);
    this.routerSubscription.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(event => this.updateLayoutMode(event.urlAfterRedirects || event.url))
    );
  }

  ngOnDestroy(): void {
    this.routerSubscription.unsubscribe();
  }

  private updateLayoutMode(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    this.isTournamentMode = path === '/tournament' || path.startsWith('/tournament/');
  }
}
