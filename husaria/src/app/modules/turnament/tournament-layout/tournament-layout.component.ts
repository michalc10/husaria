import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, EMPTY, BehaviorSubject, combineLatest, forkJoin, merge, Subscription } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, startWith, switchMap, take, tap } from 'rxjs/operators';
import { IBattle } from 'src/app/models/battle';
import { ITournamentLiveState } from 'src/app/models/judgeStation';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import { ITournament } from 'src/app/models/tournament';
import { JudgeStationService } from '../services/judge-station/judge-station.service';
import { LiveScoreSocketService } from '../services/live-score-socket/live-score-socket.service';
import { PlayerPointsService } from '../services/playerPoints/playerPoints.service';
import { TournamentService } from '../services/tournament/tournament.service';
import { OfflineSyncService } from '../../offline/offline-sync.service';

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
export class TournamentLayoutComponent implements OnInit, OnDestroy {
  private readonly tournamentRefresh$ = new BehaviorSubject<void>(undefined);
  private currentTournamentId = '';
  private latestBattles: IBattle[] = [];
  private activePanelSubscription = new Subscription();
  private realtimeSubscription = new Subscription();

  participantList: IPlayerPoints[] = [];
  activePanelLoading = true;
  offlinePrepareMessage = '';
  offlinePreparing = false;
  liveState: ITournamentLiveState = {
    tournamentId: '',
    activeTournamentPlayerId: null,
    activeBattleId: null,
    version: 0,
    activeParticipant: null,
    activeBattle: null
  };

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
    private playerPointsService: PlayerPointsService,
    private judgeStationService: JudgeStationService,
    private liveScoreSocket: LiveScoreSocketService,
    private offlineSync: OfflineSyncService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    this.activePanelSubscription.add(
      this.tournamentId$.subscribe(tournamentId => this.loadActivePanel(tournamentId))
    );
  }

  ngOnDestroy(): void {
    this.activePanelSubscription.unsubscribe();
    this.realtimeSubscription.unsubscribe();
    this.liveScoreSocket.disconnect();
  }

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

  isActiveParticipant(player: IPlayerPoints): boolean {
    return !!player._id && this.liveState.activeTournamentPlayerId === player._id;
  }

  setActiveParticipant(playerId: string | null): void {
    if (!this.currentTournamentId) return;

    this.judgeStationService.updateTournamentLiveState(this.currentTournamentId, {
      activeTournamentPlayerId: playerId
    }).subscribe({
      next: state => {
        this.liveState = state;
      },
      error: error => {
        console.error(this.transloco.translate('judge.liveStateSaveError'), error);
      }
    });
  }

  setActiveBattle(battleId: string | null): void {
    if (!this.currentTournamentId) return;

    this.judgeStationService.updateTournamentLiveState(this.currentTournamentId, {
      activeBattleId: battleId
    }).subscribe({
      next: state => {
        this.liveState = state;
      },
      error: error => {
        console.error(this.transloco.translate('judge.liveStateSaveError'), error);
      }
    });
  }

  setPreviousParticipant(): void {
    const index = this.activeParticipantIndex();
    if (index > 0) {
      this.setActiveParticipant(this.participantList[index - 1]._id || null);
    }
  }

  setNextParticipant(): void {
    const index = this.activeParticipantIndex();
    if (index >= 0 && index < this.participantList.length - 1) {
      this.setActiveParticipant(this.participantList[index + 1]._id || null);
    } else if (index === -1 && this.participantList[0]?._id) {
      this.setActiveParticipant(this.participantList[0]._id);
    }
  }

  prepareOffline(): void {
    if (!this.currentTournamentId || this.offlinePreparing) return;

    this.offlinePreparing = true;
    this.offlinePrepareMessage = '';
    this.offlineSync.prepareTournament(this.currentTournamentId).subscribe({
      next: () => {
        this.offlinePreparing = false;
        this.offlinePrepareMessage = this.transloco.translate('offline.prepared');
      },
      error: error => {
        this.offlinePreparing = false;
        this.offlinePrepareMessage = this.transloco.translate('offline.prepareError');
        console.error(this.offlinePrepareMessage, error);
      }
    });
  }

  activeParticipantIndex(): number {
    return this.participantList.findIndex(player => player._id === this.liveState.activeTournamentPlayerId);
  }

  private loadActivePanel(tournamentId: string): void {
    this.activePanelLoading = true;
    forkJoin({
      battles: this.tournamentService.getBattles(tournamentId),
      participants: this.playerPointsService.getPlayerPointsForTournament(tournamentId),
      liveState: this.judgeStationService.getTournamentLiveState(tournamentId)
    }).subscribe({
      next: ({ battles, participants, liveState }) => {
        this.latestBattles = battles.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
        this.participantList = participants.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
        this.liveState = liveState;
        this.activePanelLoading = false;
        this.connectRealtime(tournamentId);
        this.ensureInitialLiveState();
      },
      error: error => {
        this.participantList = [];
        this.activePanelLoading = false;
        console.error(this.transloco.translate('battleTable.loadError'), error);
      }
    });
  }

  private connectRealtime(tournamentId: string): void {
    this.realtimeSubscription.unsubscribe();
    this.realtimeSubscription = new Subscription();
    this.liveScoreSocket.joinTournament(tournamentId);

    this.realtimeSubscription.add(
      this.liveScoreSocket.tournamentLiveState$.subscribe(state => {
        if (state.tournamentId === tournamentId) {
          this.liveState = state;
        }
      })
    );
  }

  private ensureInitialLiveState(): void {
    const firstParticipantId = this.participantList[0]?._id;
    const firstBattleId = this.latestBattles[0]?._id;

    if (firstParticipantId && !this.liveState.activeTournamentPlayerId) {
      this.setActiveParticipant(firstParticipantId);
    }

    if (firstBattleId && !this.liveState.activeBattleId) {
      this.setActiveBattle(firstBattleId);
    }
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

    return [
      {
        label: this.transloco.translate('judge.stations'),
        value: 'live/stations',
        path: 'live/stations'
      },
      ...battles.map((battle) => {
      const path = `live/battle/${battle._id}`;
      return {
        label: `${battle.order}. ${battle.name || this.transloco.translate('competition.battleName')}`,
        value: path,
        path
      };
      })
    ];
  }

  private mapUrlToValue(url: string): string {
    if (url.includes('/live/stations')) return 'live/stations';
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
    return this.latestBattles.length ? 'live/stations' : 'planning/competitions';
  }
}
