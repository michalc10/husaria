import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, EMPTY, BehaviorSubject, combineLatest, merge } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, startWith, switchMap, take, tap } from 'rxjs/operators';
import { IBattle } from 'src/app/models/battle';
import { ITournament, TournamentStatus } from 'src/app/models/tournament';
import { TournamentService } from '../services/tournament/tournament.service';

interface SelectOption {
  label: string;
  value: string;
  path: string;
}

type TournamentStage = 'planning' | 'live' | 'results';

@Component({
    selector: 'app-tournament-layout',
    templateUrl: './tournament-layout.component.html',
    styleUrls: ['./tournament-layout.component.scss'],
    standalone: false
})
export class TournamentLayoutComponent {
  private readonly tournamentRefresh$ = new BehaviorSubject<void>(undefined);
  private currentTournamentId = '';
  private latestBattles: IBattle[] = [];

  statusSaving = false;

  readonly tournamentId$: Observable<string> = merge(
    this.route.paramMap,
    this.route.parent ? this.route.parent.paramMap : EMPTY
  ).pipe(
    map(pm => pm.get('idTournament') ?? pm.get('id')),
    filter((id): id is string => !!id),
    distinctUntilChanged(),
    tap(id => this.currentTournamentId = id),
    shareReplay(1)
  );

  readonly tournament$: Observable<ITournament> = combineLatest([
    this.tournamentId$,
    this.tournamentRefresh$
  ]).pipe(
    switchMap(([id]) => this.tournamentService.get(id)),
    map(t => ({
      ...t,
      date: t.date instanceof Date ? t.date : new Date((t as any).date),
      status: t.status || 'PLANNING'
    })),
    catchError(err => {
      console.error(this.transloco.translate('league.loadTournamentsError'), err);
      return EMPTY;
    }),
    shareReplay(1)
  );

  readonly battles$: Observable<IBattle[]> = this.tournamentId$.pipe(
    switchMap(id => this.tournamentService.getBattles(id)),
    map(battles => battles.slice().sort((a, b) => a.order - b.order)),
    tap(battles => this.latestBattles = battles),
    catchError(err => {
      console.error(this.transloco.translate('competition.loadError'), err);
      return EMPTY;
    }),
    shareReplay(1)
  );

  readonly selectedStage$: Observable<TournamentStage> = this.router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    startWith(new NavigationEnd(0, this.router.url, this.router.url)),
    map(e => this.mapUrlToStage(e.urlAfterRedirects || e.url)),
    distinctUntilChanged(),
    shareReplay(1)
  );

  readonly options$: Observable<SelectOption[]> = combineLatest([
    this.battles$,
    this.selectedStage$,
    this.transloco.selectTranslation()
  ]).pipe(
    map(([battles, stage]) => this.buildOptions(stage, battles)),
    shareReplay(1)
  );

  readonly stageOptions$: Observable<SelectOption[]> = this.transloco.selectTranslation().pipe(
    map(() => [
      { label: this.transloco.translate('tournament.stages.planning'), value: 'planning', path: 'planning/participants' },
      { label: this.transloco.translate('tournament.stages.live'), value: 'live', path: this.livePath() },
      { label: this.transloco.translate('tournament.stages.results'), value: 'results', path: 'results' }
    ]),
    shareReplay(1)
  );

  readonly selectedOption$: Observable<string> = this.router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    startWith(new NavigationEnd(0, this.router.url, this.router.url)),
    map(e => this.mapUrlToValue(e.urlAfterRedirects || e.url)),
    distinctUntilChanged(),
    shareReplay(1)
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tournamentService: TournamentService,
    private transloco: TranslocoService
  ) {}

  onOptionChange(path: string): void {
    this.router.navigate([path], { relativeTo: this.route });
  }

  onStageChange(stage: TournamentStage): void {
    if (stage === 'planning') {
      this.router.navigate(['planning/participants'], { relativeTo: this.route });
      return;
    }

    if (stage === 'live') {
      this.navigateToLiveStage();
      return;
    }

    this.router.navigate(['results'], { relativeTo: this.route });
  }

  updateStatus(status: TournamentStatus): void {
    if (!this.currentTournamentId || this.statusSaving) return;

    this.statusSaving = true;
    this.tournamentService.updateStatus(this.currentTournamentId, status).subscribe({
      next: (tournament) => {
        this.statusSaving = false;
        this.tournamentRefresh$.next();
        this.navigateForStatus(tournament.status || status);
      },
      error: (err) => {
        this.statusSaving = false;
        console.error(this.transloco.translate('tournament.statusChangeError'), err);
      }
    });
  }

  statusKey(status?: TournamentStatus): string {
    return `tournament.status.${status || 'PLANNING'}`;
  }

  statusClass(status?: TournamentStatus): string {
    return `tl-status--${(status || 'PLANNING').toLowerCase()}`;
  }

  private buildOptions(stage: TournamentStage, battles: IBattle[]): SelectOption[] {
    if (stage === 'planning') {
      return [
        {
          label: this.transloco.translate('tournament.players'),
          value: 'planning/participants',
          path: 'planning/participants'
        },
        {
          label: this.transloco.translate('tournament.competitions'),
          value: 'planning/competitions',
          path: 'planning/competitions'
        }
      ];
    }

    if (stage === 'results') {
      return [
        {
          label: this.transloco.translate('tournament.results'),
          value: 'results',
          path: 'results'
        }
      ];
    }

    return battles.map((battle) => {
      const path = `live/battle/${battle._id}`;
      return {
        label: `${battle.order}. ${battle.name || this.transloco.translate('competition.battleName')}`,
        value: path,
        path
      };
    });
  }

  private mapUrlToValue(url: string): string {
    const battleMatch = url.match(/\/(?:live\/)?battle\/([^/]+)/);
    if (battleMatch) return `live/battle/${battleMatch[1]}`;
    if (url.includes('/competition')) return 'planning/competitions';
    if (url.includes('/results') || url.includes('/result')) return 'results';
    return 'planning/participants';
  }

  private mapUrlToStage(url: string): TournamentStage {
    if (url.includes('/live/') || url.endsWith('/live')) return 'live';
    if (url.includes('/results') || url.includes('/result')) return 'results';
    return 'planning';
  }

  private navigateForStatus(status: TournamentStatus): void {
    if (status === 'LIVE') {
      this.navigateToLiveStage();
      return;
    }

    if (status === 'FINISHED') {
      this.router.navigate(['results'], { relativeTo: this.route });
      return;
    }

    this.router.navigate(['planning/participants'], { relativeTo: this.route });
  }

  private navigateToLiveStage(): void {
    const path = this.livePath();
    if (path !== 'planning/competitions') {
      this.router.navigate([path], { relativeTo: this.route });
      return;
    }

    this.battles$.pipe(take(1)).subscribe((battles) => {
      const firstBattle = battles[0];
      this.router.navigate([firstBattle?._id ? `live/battle/${firstBattle._id}` : 'planning/competitions'], {
        relativeTo: this.route
      });
    });
  }

  private livePath(): string {
    const firstBattle = this.latestBattles[0];
    return firstBattle?._id ? `live/battle/${firstBattle._id}` : 'planning/competitions';
  }
}
