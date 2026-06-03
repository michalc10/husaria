import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TournamentService } from '../services/tournament/tournament.service';

@Component({
  selector: 'app-tournament-default',
  template: '',
  standalone: false
})
export class TournamentDefaultComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tournamentService: TournamentService
  ) {}

  ngOnInit(): void {
    const tournamentId = this.route.parent?.snapshot.paramMap.get('idTournament');

    if (!tournamentId) {
      this.router.navigate(['planning/participants'], { relativeTo: this.route.parent || this.route, replaceUrl: true });
      return;
    }

    if (this.route.snapshot.routeConfig?.path !== 'live') {
      this.router.navigate(['planning/participants'], {
        relativeTo: this.route.parent || this.route,
        replaceUrl: true
      });
      return;
    }

    this.tournamentService.getBattles(tournamentId).pipe(catchError(() => of([]))).subscribe({
      next: battles => {
        this.router.navigate([battles.length ? 'live/stations' : 'planning/competitions'], {
          relativeTo: this.route.parent || this.route,
          replaceUrl: true
        });
      },
      error: () => {
        this.router.navigate(['planning/participants'], {
          relativeTo: this.route.parent || this.route,
          replaceUrl: true
        });
      }
    });
  }
}
