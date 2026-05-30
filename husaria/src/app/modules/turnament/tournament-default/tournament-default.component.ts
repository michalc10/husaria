import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TournamentStatus } from 'src/app/models/tournament';
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

    forkJoin({
      tournament: this.tournamentService.get(tournamentId),
      battles: this.tournamentService.getBattles(tournamentId).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ tournament, battles }) => {
        this.router.navigate([this.defaultPath(tournament.status || 'PLANNING', battles[0]?._id)], {
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

  private defaultPath(status: TournamentStatus, firstBattleId?: string): string {
    if (status === 'LIVE') {
      return firstBattleId ? `live/battle/${firstBattleId}` : 'planning/competitions';
    }

    if (status === 'FINISHED') {
      return 'results';
    }

    return 'planning/participants';
  }
}
