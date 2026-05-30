import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ILeague } from 'src/app/models/league';
import { ITournament, TournamentStatus } from 'src/app/models/tournament';
import { TournamentService } from 'src/app/modules/turnament/services/tournament/tournament.service';
import { CrudService } from 'src/app/shered/service/crud.service';

@Component({
  selector: 'app-league-list',
  templateUrl: './league-list.component.html',
  styleUrls: ['./league-list.component.scss'],
  standalone: false
})
export class LeagueListComponent implements OnInit {
  readonly leagueRoute = 'league';

  leagueList: ILeague[] = [];
  tournamentList: ITournament[] = [];
  chosenLeague: ILeague = { _id: '-1', name: '', year: '' };
  displayDialogCompnent = false;
  idchosenRaw = '-1';
  display = false;
  searchTerm = '';
  loadingTournaments = false;

  constructor(
    private router: Router,
    private crudService: CrudService,
    private tournamentService: TournamentService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    this.loadLeagues();
  }

  get filteredLeagues(): ILeague[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.leagueList;

    return this.leagueList.filter((league) =>
      [league.name, league.year].some((value) => String(value || '').toLowerCase().includes(term))
    );
  }

  get selectedLeague(): ILeague | null {
    return this.leagueList.find((league) => league._id === this.idchosenRaw) || null;
  }

  createLeague(): void {
    this.chosenLeague = { _id: '-1', name: '', year: '', tournaments: [] };
    this.displayDialogCompnent = true;
    this.display = true;
  }

  changeLeague(league: ILeague): void {
    this.chosenLeague = { ...league };
    this.displayDialogCompnent = true;
    this.display = true;
  }

  closedDialogWithoutSaving(_: boolean): void {
    this.display = false;
  }

  returnFromChild(league: ILeague): void {
    this.display = false;
    const tournamentPayloads = league.tournaments || [];

    if (league._id && league._id !== '-1') {
      const { tournaments, ...payload } = league;
      this.crudService.update<ILeague, ILeague>(this.leagueRoute, league._id, payload as ILeague).pipe(
        switchMap((savedLeague) =>
          this.saveTournaments(savedLeague._id!, tournamentPayloads).pipe(
            switchMap(() => this.refreshLeagueWorkspace(savedLeague._id!))
          )
        )
      ).subscribe({
        error: (err) => {
          this.loadingTournaments = false;
          console.error(this.transloco.translate('league.saveTournamentsError'), err);
        }
      });
      return;
    }

    const payload = {
      name: league.name,
      year: league.year,
      tournaments: tournamentPayloads
    };

    this.crudService.create<typeof payload, ILeague>(this.leagueRoute, payload).pipe(
      switchMap((savedLeague) => this.refreshLeagueWorkspace(savedLeague._id!))
    ).subscribe({
      error: (err) => {
        this.loadingTournaments = false;
        console.error(this.transloco.translate('league.saveTournamentsError'), err);
      }
    });
  }

  chooseLeague(league: ILeague): void {
    if (this.idchosenRaw === league._id) return;

    this.idchosenRaw = league._id || '-1';
    this.chosenLeague = league;
    this.loadTournaments(league);
  }

  selectedTournament(tournament: ITournament): void {
    this.router.navigate(['tournament/' + tournament._id!.toString()]);
  }

  tournamentName(tournament: ITournament): string {
    return tournament.city || this.transloco.translate('league.newTournament');
  }

  openTournamentLabel(tournament: ITournament): string {
    return this.transloco.translate('league.openTournament', {
      city: this.tournamentName(tournament)
    });
  }

  tournamentStatusKey(status?: TournamentStatus): string {
    return `tournament.status.${status || 'PLANNING'}`;
  }

  tournamentStatusClass(status?: TournamentStatus): string {
    return `tournament-card__status--${(status || 'PLANNING').toLowerCase()}`;
  }

  tournamentPrimaryAction(tournament: ITournament): string {
    const status = tournament.status || 'PLANNING';

    if (status === 'LIVE') {
      return this.transloco.translate('league.leadTournament');
    }

    if (status === 'FINISHED') {
      return this.transloco.translate('league.viewResults');
    }

    return this.transloco.translate('league.planTournament');
  }

  trackLeague(_: number, league: ILeague): string {
    return league._id || `${league.name}-${league.year}`;
  }

  trackTournament(_: number, tournament: ITournament): string {
    return tournament._id || `${tournament.city}-${tournament.date}`;
  }

  private loadLeagues(): void {
    this.crudService.list<ILeague>(this.leagueRoute).subscribe({
      next: (leagues) => {
        this.leagueList = this.sortLeagues(leagues);

        if (!this.selectedLeague && this.leagueList.length) {
          this.chooseLeague(this.leagueList[0]);
        }
      },
      error: (err) => console.error(this.transloco.translate('league.loadError'), err)
    });
  }

  private loadTournaments(league: ILeague): void {
    if (!league._id) return;

    this.loadingTournaments = true;
    this.crudService.read<ITournament[]>('tournament/league', league._id).subscribe({
      next: (tournaments) => {
        this.tournamentList = this.sortTournaments(tournaments);
        this.loadingTournaments = false;
      },
      error: (err) => {
        this.loadingTournaments = false;
        console.error(this.transloco.translate('league.loadTournamentsError'), err);
      }
    });
  }

  private saveTournaments(leagueId: string, tournaments: Array<Partial<ITournament>>) {
    const requests = tournaments.map((tournament) => {
      const payload = this.toTournamentPayload(tournament);

      return tournament._id
        ? this.tournamentService.update(tournament._id, payload)
        : this.tournamentService.create({ ...payload, leagueId });
    });

    return requests.length ? forkJoin(requests) : of([]);
  }

  private refreshLeagueWorkspace(leagueId: string) {
    this.loadingTournaments = true;

    return forkJoin({
      leagues: this.crudService.list<ILeague>(this.leagueRoute),
      tournaments: this.crudService.read<ITournament[]>('tournament/league', leagueId)
    }).pipe(
      map(({ leagues, tournaments }) => {
        this.leagueList = this.sortLeagues(leagues);
        const selected = this.leagueList.find((league) => league._id === leagueId) || this.leagueList[0] || null;
        this.idchosenRaw = selected?._id || '-1';
        this.chosenLeague = selected || { _id: '-1', name: '', year: '', tournaments: [] };
        this.tournamentList = this.sortTournaments(tournaments);
        this.loadingTournaments = false;
        return selected;
      })
    );
  }

  private toTournamentPayload(tournament: Partial<ITournament>): Partial<ITournament> {
    return {
      city: tournament.city || '',
      date: tournament.date instanceof Date
        ? tournament.date
        : new Date((tournament as any).date || Date.now())
    };
  }

  private sortTournaments(tournaments: ITournament[]): ITournament[] {
    return [...tournaments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  private sortLeagues(leagues: ILeague[]): ILeague[] {
    return [...leagues].sort((a, b) => {
      const yearDiff = Number.parseInt(b.year, 10) - Number.parseInt(a.year, 10);
      return yearDiff || a.name.localeCompare(b.name, 'pl');
    });
  }
}
