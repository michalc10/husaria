import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { ILeague } from 'src/app/models/league';
import {
  ICreateFinalTournamentPayload,
  ILeagueStanding,
  ILeagueStandingTournament,
  ILeagueTeamStanding,
  ILeagueTeamStandingTournament
} from 'src/app/models/leagueStanding';
import { ITournament, TournamentStatus } from 'src/app/models/tournament';
import { AuthService } from 'src/app/modules/auth/auth.service';
import { TournamentService } from 'src/app/modules/turnament/services/tournament/tournament.service';
import { CrudService } from 'src/app/shered/service/crud.service';
import { LeagueService } from '../../services/league.service';

type LeagueDetailsTab = 'tournaments' | 'standings';
type StandingMode = 'individual' | 'team';

@Component({
  selector: 'app-league-list',
  templateUrl: './league-list.component.html',
  styleUrls: ['./league-list.component.scss'],
  standalone: false
})
export class LeagueListComponent implements OnInit {
  readonly leagueRoute = 'league';
  readonly isAdmin$: Observable<boolean>;

  leagueList: ILeague[] = [];
  tournamentList: ITournament[] = [];
  leagueStandings: ILeagueStanding[] = [];
  leagueTeamStandings: ILeagueTeamStanding[] = [];
  chosenLeague: ILeague = { _id: '-1', name: '', year: '' };
  displayDialogCompnent = false;
  idchosenRaw = '-1';
  display = false;
  searchTerm = '';
  loadingTournaments = false;
  loadingStandings = false;
  loadingTeamStandings = false;
  standingsLoadFailed = false;
  teamStandingsLoadFailed = false;
  activeDetailsTab: LeagueDetailsTab = 'tournaments';
  standingMode: StandingMode = 'individual';
  expandedStandingId: string | null = null;
  expandedTeamStandingId: string | null = null;
  countedTournaments = 0;
  teamCountedTournaments = 0;
  teamSize = 3;
  finalTournamentDialogVisible = false;
  creatingFinalTournament = false;
  finalTournamentForm = {
    finalistsCount: 10,
    city: 'Finał',
    date: new Date(),
    copyBattlesFromTournamentId: null as string | null
  };

  constructor(
    private router: Router,
    private crudService: CrudService,
    private tournamentService: TournamentService,
    private leagueService: LeagueService,
    private transloco: TranslocoService,
    private authService: AuthService
  ) {
    this.isAdmin$ = this.authService.isAdmin$;
  }

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

  get standingsMaxTournaments(): number {
    return this.tournamentList.filter((tournament) => tournament.countsInLeagueStandings !== false).length;
  }

  get displayedCountedTournaments(): number {
    return this.countedTournaments || this.standingsMaxTournaments;
  }

  get finalTournamentPreview(): ILeagueStanding[] {
    return this.leagueStandings.slice(0, this.normalizedFinalistsCount());
  }

  get finalTournamentCopyOptions(): Array<{ label: string; value: string | null }> {
    return [
      { label: this.transloco.translate('league.noBattleCopy'), value: null },
      ...this.tournamentList.map((tournament) => ({
        label: `${this.tournamentName(tournament)} - ${new Date(tournament.date).toLocaleDateString('pl-PL')}`,
        value: tournament._id || null
      }))
    ];
  }

  get canCreateFinalTournament(): boolean {
    return !!this.selectedLeague?._id && !!this.leagueStandings.length && !this.creatingFinalTournament;
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
          this.loadingStandings = false;
          this.loadingTeamStandings = false;
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
        this.loadingStandings = false;
        this.loadingTeamStandings = false;
        console.error(this.transloco.translate('league.saveTournamentsError'), err);
      }
    });
  }

  chooseLeague(league: ILeague): void {
    if (this.idchosenRaw === league._id) return;

    this.idchosenRaw = league._id || '-1';
    this.chosenLeague = league;
    this.countedTournaments = 0;
    this.teamCountedTournaments = 0;
    this.loadLeagueDetails(league);
  }

  selectedTournament(tournament: ITournament): void {
    this.router.navigate(['tournament/' + tournament._id!.toString()]);
  }

  deleteLeague(league: ILeague): void {
    if (!league._id) return;

    const confirmed = window.confirm(this.transloco.translate('league.deleteConfirm', {
      name: league.name,
      count: this.tournamentList.length
    }));

    if (!confirmed) return;

    this.loadingTournaments = true;
    this.loadingStandings = true;
    this.loadingTeamStandings = true;
    this.crudService.delete(this.leagueRoute, league._id).pipe(
      switchMap(() => this.crudService.list<ILeague>(this.leagueRoute))
    ).subscribe({
      next: (leagues) => {
        this.leagueList = this.sortLeagues(leagues);
        const nextLeague = this.leagueList[0] || null;
        this.idchosenRaw = nextLeague?._id || '-1';
        this.chosenLeague = nextLeague || { _id: '-1', name: '', year: '', tournaments: [] };
        this.tournamentList = [];
        this.leagueStandings = [];
        this.leagueTeamStandings = [];
        this.expandedStandingId = null;
        this.expandedTeamStandingId = null;
        this.countedTournaments = 0;
        this.teamCountedTournaments = 0;
        this.loadingTournaments = false;
        this.loadingStandings = false;
        this.loadingTeamStandings = false;

        if (nextLeague) {
          this.loadLeagueDetails(nextLeague);
        }
      },
      error: (err) => {
        this.loadingTournaments = false;
        this.loadingStandings = false;
        this.loadingTeamStandings = false;
        console.error(this.transloco.translate('league.deleteError'), err);
      }
    });
  }

  deleteTournament(tournament: ITournament): void {
    if (!tournament._id || !this.selectedLeague?._id) return;

    const confirmed = window.confirm(this.transloco.translate('league.deleteTournamentConfirm', {
      city: this.tournamentName(tournament)
    }));

    if (!confirmed) return;

    this.loadingTournaments = true;
    this.crudService.delete('tournament', tournament._id).subscribe({
      next: () => this.loadLeagueDetails(this.selectedLeague!),
      error: (err) => {
        this.loadingTournaments = false;
        console.error(this.transloco.translate('league.deleteTournamentError'), err);
      }
    });
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

  tournamentCountsLabel(tournament: ITournament): string {
    return tournament.countsInLeagueStandings === false
      ? this.transloco.translate('league.excludedFromStandings')
      : this.transloco.translate('league.includedInStandings');
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

  trackStanding(_: number, standing: ILeagueStanding): string {
    return standing.playerId;
  }

  trackStandingTournament(_: number, tournament: ILeagueStandingTournament): string {
    return tournament.tournamentId;
  }

  trackTeamStanding(_: number, standing: ILeagueTeamStanding): string {
    return standing.bannerKey;
  }

  trackTeamStandingTournament(_: number, tournament: ILeagueTeamStandingTournament): string {
    return tournament.tournamentId;
  }

  showTournaments(): void {
    this.activeDetailsTab = 'tournaments';
  }

  showStandings(): void {
    this.activeDetailsTab = 'standings';
    if (this.selectedLeague?._id && !this.leagueStandings.length && !this.loadingStandings) {
      this.loadStandings(this.selectedLeague);
    }
  }

  refreshStandings(): void {
    if (this.selectedLeague) {
      this.standingMode === 'team'
        ? this.loadTeamStandings(this.selectedLeague)
        : this.loadStandings(this.selectedLeague);
    }
  }

  updateCountedTournaments(value: number | string | null): void {
    if (!this.selectedLeague || !this.standingsMaxTournaments) return;

    const numericValue = Number(value);
    this.countedTournaments = this.clampCountedTournaments(Number.isFinite(numericValue) ? numericValue : 1);
    this.loadStandings(this.selectedLeague);
  }

  showIndividualStandings(): void {
    this.standingMode = 'individual';
    if (this.selectedLeague?._id && !this.leagueStandings.length && !this.loadingStandings) {
      this.loadStandings(this.selectedLeague);
    }
  }

  showTeamStandings(): void {
    this.standingMode = 'team';
    if (this.selectedLeague?._id && !this.leagueTeamStandings.length && !this.loadingTeamStandings) {
      this.loadTeamStandings(this.selectedLeague);
    }
  }

  updateTeamCountedTournaments(value: number | string | null): void {
    if (!this.selectedLeague || !this.standingsMaxTournaments) return;

    const numericValue = Number(value);
    this.teamCountedTournaments = this.clampCountedTournaments(Number.isFinite(numericValue) ? numericValue : 1);
    this.loadTeamStandings(this.selectedLeague);
  }

  updateTeamSize(value: number | string | null): void {
    if (!this.selectedLeague) return;

    const numericValue = Number(value);
    this.teamSize = Math.min(Math.max(Math.trunc(Number.isFinite(numericValue) ? numericValue : 3), 1), 30);
    this.loadTeamStandings(this.selectedLeague);
  }

  toggleStanding(standing: ILeagueStanding): void {
    this.expandedStandingId = this.expandedStandingId === standing.playerId ? null : standing.playerId;
  }

  toggleTeamStanding(standing: ILeagueTeamStanding): void {
    this.expandedTeamStandingId = this.expandedTeamStandingId === standing.bannerKey ? null : standing.bannerKey;
  }

  standingBanner(standing: ILeagueStanding): string {
    return standing.bannerName || standing.flag || this.transloco.translate('banner.none');
  }

  tournamentStandingName(tournament: ILeagueStandingTournament): string {
    return tournament.city || this.transloco.translate('league.newTournament');
  }

  tournamentTeamStandingName(tournament: ILeagueTeamStandingTournament): string {
    return tournament.city || this.transloco.translate('league.newTournament');
  }

  formatScore(score: number): string {
    return Number(score || 0).toFixed(3);
  }

  openFinalTournamentDialog(): void {
    if (!this.canCreateFinalTournament) return;

    this.finalTournamentForm = {
      finalistsCount: Math.min(10, this.leagueStandings.length || 10),
      city: this.transloco.translate('league.finalDefaultCity'),
      date: new Date(),
      copyBattlesFromTournamentId: this.tournamentList[0]?._id || null
    };
    this.finalTournamentDialogVisible = true;
  }

  updateFinalTournamentCount(value: number | string | null): void {
    const numericValue = Number(value);
    this.finalTournamentForm.finalistsCount = this.clampFinalistsCount(Number.isFinite(numericValue) ? numericValue : 10);
  }

  createFinalTournament(): void {
    const leagueId = this.selectedLeague?._id;
    if (!leagueId || this.creatingFinalTournament) return;

    const payload: ICreateFinalTournamentPayload = {
      finalistsCount: this.normalizedFinalistsCount(),
      countedTournaments: this.countedTournaments || undefined,
      city: this.finalTournamentForm.city || this.transloco.translate('league.finalDefaultCity'),
      date: this.finalTournamentForm.date,
      copyBattlesFromTournamentId: this.finalTournamentForm.copyBattlesFromTournamentId || null
    };

    this.creatingFinalTournament = true;
    this.leagueService.createFinalTournament(leagueId, payload).pipe(
      switchMap((response) => this.refreshLeagueWorkspace(leagueId).pipe(map(() => response)))
    ).subscribe({
      next: (response) => {
        this.creatingFinalTournament = false;
        this.finalTournamentDialogVisible = false;
        if (response.tournament._id) {
          this.router.navigate(['tournament/' + response.tournament._id]);
        }
      },
      error: (err) => {
        this.creatingFinalTournament = false;
        console.error(this.transloco.translate('league.finalCreateError'), err);
      }
    });
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
        this.normalizeCountedTournaments();
        this.normalizeTeamCountedTournaments();
        this.loadingTournaments = false;
      },
      error: (err) => {
        this.loadingTournaments = false;
        console.error(this.transloco.translate('league.loadTournamentsError'), err);
      }
    });
  }

  private loadStandings(league: ILeague): void {
    if (!league._id) return;

    this.loadingStandings = true;
    this.standingsLoadFailed = false;
    this.leagueService.getStandings(league._id, this.countedTournaments || undefined).subscribe({
      next: (standings) => {
        this.leagueStandings = standings;
        const backendCount = standings[0]?.countedTournaments;
        if (backendCount !== undefined) {
          this.countedTournaments = backendCount;
        }
        this.expandedStandingId = null;
        this.loadingStandings = false;
      },
      error: (err) => {
        this.loadingStandings = false;
        this.standingsLoadFailed = true;
        this.leagueStandings = [];
        console.error(this.transloco.translate('league.standingsLoadError'), err);
      }
    });
  }

  private loadTeamStandings(league: ILeague): void {
    if (!league._id) return;

    this.loadingTeamStandings = true;
    this.teamStandingsLoadFailed = false;
    this.leagueService.getTeamStandings(league._id, this.teamCountedTournaments || undefined, this.teamSize).subscribe({
      next: (standings) => {
        this.leagueTeamStandings = standings;
        const backendCount = standings[0]?.countedTournaments;
        const backendTeamSize = standings[0]?.teamSize;
        if (backendCount !== undefined) {
          this.teamCountedTournaments = backendCount;
        }
        if (backendTeamSize !== undefined) {
          this.teamSize = backendTeamSize;
        }
        this.expandedTeamStandingId = null;
        this.loadingTeamStandings = false;
      },
      error: (err) => {
        this.loadingTeamStandings = false;
        this.teamStandingsLoadFailed = true;
        this.leagueTeamStandings = [];
        console.error(this.transloco.translate('league.teamStandingsLoadError'), err);
      }
    });
  }

  private loadLeagueDetails(league: ILeague): void {
    this.loadTournaments(league);
    this.loadStandings(league);
    this.loadTeamStandings(league);
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
    this.loadingStandings = true;
    this.loadingTeamStandings = true;
    this.standingsLoadFailed = false;
    this.teamStandingsLoadFailed = false;

    return forkJoin({
      leagues: this.crudService.list<ILeague>(this.leagueRoute),
      tournaments: this.crudService.read<ITournament[]>('tournament/league', leagueId),
      standings: this.leagueService.getStandings(leagueId, this.countedTournaments || undefined),
      teamStandings: this.leagueService.getTeamStandings(leagueId, this.teamCountedTournaments || undefined, this.teamSize)
    }).pipe(
      map(({ leagues, tournaments, standings, teamStandings }) => {
        this.leagueList = this.sortLeagues(leagues);
        const selected = this.leagueList.find((league) => league._id === leagueId) || this.leagueList[0] || null;
        this.idchosenRaw = selected?._id || '-1';
        this.chosenLeague = selected || { _id: '-1', name: '', year: '', tournaments: [] };
        this.tournamentList = this.sortTournaments(tournaments);
        this.normalizeCountedTournaments();
        this.normalizeTeamCountedTournaments();
        this.leagueStandings = standings;
        this.leagueTeamStandings = teamStandings;
        const backendCount = standings[0]?.countedTournaments;
        const backendTeamCount = teamStandings[0]?.countedTournaments;
        const backendTeamSize = teamStandings[0]?.teamSize;
        if (backendCount !== undefined) {
          this.countedTournaments = backendCount;
        }
        if (backendTeamCount !== undefined) {
          this.teamCountedTournaments = backendTeamCount;
        }
        if (backendTeamSize !== undefined) {
          this.teamSize = backendTeamSize;
        }
        this.expandedStandingId = null;
        this.expandedTeamStandingId = null;
        this.loadingTournaments = false;
        this.loadingStandings = false;
        this.loadingTeamStandings = false;
        return selected;
      })
    );
  }

  private toTournamentPayload(tournament: Partial<ITournament>): Partial<ITournament> {
    return {
      city: tournament.city || '',
      date: tournament.date instanceof Date
        ? tournament.date
        : new Date((tournament as any).date || Date.now()),
      countsInLeagueStandings: tournament.countsInLeagueStandings ?? true
    };
  }

  private sortTournaments(tournaments: ITournament[]): ITournament[] {
    return [...tournaments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  private normalizeCountedTournaments(): void {
    if (!this.standingsMaxTournaments) {
      this.countedTournaments = 0;
      return;
    }

    this.countedTournaments = this.countedTournaments
      ? this.clampCountedTournaments(this.countedTournaments)
      : this.standingsMaxTournaments;
  }

  private normalizeTeamCountedTournaments(): void {
    if (!this.standingsMaxTournaments) {
      this.teamCountedTournaments = 0;
      return;
    }

    this.teamCountedTournaments = this.teamCountedTournaments
      ? this.clampCountedTournaments(this.teamCountedTournaments)
      : this.standingsMaxTournaments;
  }

  private clampCountedTournaments(value: number): number {
    return Math.min(Math.max(Math.trunc(value), 1), this.standingsMaxTournaments);
  }

  private normalizedFinalistsCount(): number {
    return this.clampFinalistsCount(this.finalTournamentForm.finalistsCount || 10);
  }

  private clampFinalistsCount(value: number): number {
    const max = Math.max(this.leagueStandings.length, 1);
    return Math.min(Math.max(Math.trunc(value), 1), max);
  }

  private sortLeagues(leagues: ILeague[]): ILeague[] {
    return [...leagues].sort((a, b) => {
      const yearDiff = Number.parseInt(b.year, 10) - Number.parseInt(a.year, 10);
      return yearDiff || a.name.localeCompare(b.name, 'pl');
    });
  }
}
