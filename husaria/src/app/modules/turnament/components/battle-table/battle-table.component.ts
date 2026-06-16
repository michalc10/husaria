import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { forkJoin, of } from 'rxjs';
import { Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { PageOrientation, PageSize } from 'pdfmake/interfaces';
import { IBattle, IBattleObstacle, IBattlePenalty, IBattleResult } from 'src/app/models/battle';
import { ITournamentLiveState } from 'src/app/models/judgeStation';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import { JudgeStationService } from '../../services/judge-station/judge-station.service';
import { LiveScoreSocketService } from '../../services/live-score-socket/live-score-socket.service';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';
import { TournamentService } from '../../services/tournament/tournament.service';
import { OfflineSyncService } from '../../../offline/offline-sync.service';

(pdfMake as any).vfs = (pdfFonts as any)['pdfMake']?.vfs ?? (pdfFonts as any).vfs;

@Component({
    selector: 'app-battle-table',
    templateUrl: './battle-table.component.html',
    styleUrls: ['./battle-table.component.scss'],
    standalone: false
})
export class BattleTableComponent implements OnInit, OnDestroy {
  selectedPlayerId = '-1';
  selectedColumnKey = '';
  participantList: IPlayerPoints[] = [];
  battles: IBattle[] = [];
  battle?: IBattle;
  battleId = '';
  tournamentId = '';
  loading = true;
  errorMessage = '';
  syncStatusMessage = '';
  compactTable = false;
  fullscreenTable = false;
  pdfTextSize = 5.4;
  pdfOrientation: PageOrientation = 'landscape';
  liveState: ITournamentLiveState = {
    tournamentId: '',
    activeTournamentPlayerId: null,
    activeBattleId: null,
    version: 0,
    activeParticipant: null,
    activeBattle: null
  };

  private liveSubscription = new Subscription();

  constructor(
    private playerPointsService: PlayerPointsService,
    private route: ActivatedRoute,
    private tournamentService: TournamentService,
    private transloco: TranslocoService,
    private judgeStationService: JudgeStationService,
    private liveScoreSocket: LiveScoreSocketService,
    private offlineSync: OfflineSyncService,
    private elementRef: ElementRef<HTMLElement>
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.resetComponentState();
      this.battleId = params.get('battleId') || '';

      const tournamentId = this.getTournamentId();
      if (tournamentId && this.battleId) {
        this.tournamentId = tournamentId;
        this.loadBattleAndParticipants(tournamentId);
      } else {
        console.error(this.transloco.translate('battleTable.missingRoute'));
      }
    });
  }

  ngOnDestroy(): void {
    this.liveSubscription.unsubscribe();
  }

  resetComponentState() {
    this.selectedPlayerId = '-1';
    this.selectedColumnKey = '';
    this.participantList = [];
    this.battles = [];
    this.battle = undefined;
    this.battleId = '';
    this.tournamentId = '';
    this.loading = true;
    this.errorMessage = '';
    this.syncStatusMessage = '';
    this.liveState = {
      tournamentId: '',
      activeTournamentPlayerId: null,
      activeBattleId: null,
      version: 0,
      activeParticipant: null,
      activeBattle: null
    };
    this.liveSubscription.unsubscribe();
    this.liveSubscription = new Subscription();
  }

  private getTournamentId(): string | null {
    let current: ActivatedRoute | null = this.route;

    while (current) {
      const tournamentId = current.snapshot.paramMap.get('idTournament') ?? current.snapshot.paramMap.get('id');
      if (tournamentId) return tournamentId;
      current = current.parent;
    }

    return null;
  }

  loadBattleAndParticipants(tournamentId: string): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      battles: this.tournamentService.getBattles(tournamentId),
      participants: this.playerPointsService.getPlayerPointsForTournament(tournamentId).pipe(
        catchError(error => {
          console.error(this.transloco.translate('battleTable.loadParticipantsError'), error);
          return of([] as IPlayerPoints[]);
        })
      ),
      liveState: this.judgeStationService.getTournamentLiveState(tournamentId).pipe(
        catchError(error => {
          console.error(this.transloco.translate('judge.liveStateLoadError'), error);
          return of({
            tournamentId,
            activeTournamentPlayerId: null,
            activeBattleId: null,
            version: 0,
            activeParticipant: null,
            activeBattle: null
          } as ITournamentLiveState);
        })
      )
    }).subscribe({
      next: ({ battles, participants, liveState }) => {
        this.applyLoadedData(battles, participants, liveState);
      },
      error: error => {
        console.error(this.transloco.translate('battleTable.loadError'), error);
        this.loadCachedTournament(tournamentId);
      }
    });
  }

  isActiveParticipant(player: IPlayerPoints): boolean {
    return !!player._id && this.liveState.activeTournamentPlayerId === player._id;
  }

  setActiveParticipant(player: IPlayerPoints, event?: Event): void {
    event?.stopPropagation();
    if (!player._id || !this.tournamentId) return;
    if (this.isActiveParticipant(player) && this.liveState.activeBattleId === this.battleId) return;

    this.chosenRow(player);
    this.updateTournamentLiveState({
      activeTournamentPlayerId: player._id,
      activeBattleId: this.battleId
    });
  }

  private connectRealtime(): void {
    this.liveSubscription.unsubscribe();
    this.liveSubscription = new Subscription();
    this.liveScoreSocket.joinBattle(this.battleId);
    this.liveScoreSocket.joinTournament(this.tournamentId);

    this.liveSubscription.add(
      this.liveScoreSocket.tournamentLiveState$.subscribe(state => {
        if (state.tournamentId === this.tournamentId) {
          this.liveState = state;
        }
      })
    );

    this.liveSubscription.add(
      this.liveScoreSocket.battleResult$.subscribe(result => {
        if (result.battleId !== this.battleId) return;
        const participant = this.participantList.find(item => item._id === result.tournamentPlayerId);
        if (participant) {
          this.replaceBattleResult(participant, result);
        }
      })
    );

  }

  chosenRow(player: IPlayerPoints) {
    this.selectedPlayerId = player._id!;
  }

  toggleCompactTable(): void {
    this.compactTable = !this.compactTable;
  }

  toggleFullscreenTable(): void {
    this.fullscreenTable = !this.fullscreenTable;
    const shell = this.elementRef.nativeElement.querySelector('.battle-table-shell') as HTMLElement | null;

    if (this.fullscreenTable && shell?.requestFullscreen && !document.fullscreenElement) {
      shell.requestFullscreen().catch(() => undefined);
    }

    if (!this.fullscreenTable && document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    if (!document.fullscreenElement) {
      this.fullscreenTable = false;
    }
  }

  chosenCell(player: IPlayerPoints, columnKey: string): void {
    this.chosenRow(player);
    this.selectedColumnKey = columnKey;
  }

  obstacleColumnKey(obstacle: IBattleObstacle): string {
    return `obstacle:${obstacle._id || obstacle.order || obstacle.name}`;
  }

  penaltyColumnKey(penalty: IBattlePenalty): string {
    return `penalty:${penalty._id || penalty.order || penalty.name}`;
  }

  isColumnSelected(columnKey: string): boolean {
    return this.selectedColumnKey === columnKey;
  }

  toggleObstacle(player: IPlayerPoints, obstacle: IBattleObstacle): void {
    this.chosenCell(player, this.obstacleColumnKey(obstacle));
    const current = this.getObstacleValue(player, obstacle);
    this.setObstacleValue(player, obstacle, current === '1' ? '0' : '1');
  }

  setSelectObstacle(player: IPlayerPoints, obstacle: IBattleObstacle, event: { value?: string | null }): void {
    this.chosenCell(player, this.obstacleColumnKey(obstacle));
    this.setObstacleValue(player, obstacle, String(event.value ?? '0'));
  }

  togglePenalty(player: IPlayerPoints, penalty: IBattlePenalty): void {
    this.chosenCell(player, this.penaltyColumnKey(penalty));
    const current = this.isPenaltySelected(player, penalty);
    this.setPenaltyValue(player, penalty, !current);
  }

  setExtraPoints(player: IPlayerPoints, extraPoints: number | null | undefined): void {
    this.chosenCell(player, 'extraPoints');
    this.updateBattleResult(player, {
      extraPoints: Number(extraPoints || 0)
    });
  }

  setTime(player: IPlayerPoints, time: number | null | undefined): void {
    this.chosenCell(player, 'time');
    this.updateBattleResult(player, {
      time: Number(time || 0)
    });
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const allowedChars = /[0-9.,-]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!allowedChars.test(inputChar) && event.charCode !== 0) {
      event.preventDefault();
    }
  }

  isSelectObstacle(obstacle: IBattleObstacle): boolean {
    return obstacle.inputType === 'select';
  }

  selectOptions(obstacle: IBattleObstacle) {
    return (obstacle.scoreOptions || []).map(option => ({
      label: option.label || option.code,
      value: option.code
    }));
  }

  getObstacleValue(player: IPlayerPoints, obstacle: IBattleObstacle): string {
    const obstacleId = obstacle._id;
    if (!obstacleId) return '0';
    return this.getBattleResult(player)?.obstacleResults.find(result => result.obstacleId === obstacleId)?.value || '0';
  }

  isObstacleSelected(player: IPlayerPoints, obstacle: IBattleObstacle): boolean {
    return this.getObstacleValue(player, obstacle) === '1';
  }

  isPenaltySelected(player: IPlayerPoints, penalty: IBattlePenalty): boolean {
    const penaltyId = penalty._id;
    if (!penaltyId) return false;
    return !!this.getBattleResult(player)?.penaltyResults.find(result => result.penaltyId === penaltyId)?.selected;
  }

  getExtraPoints(player: IPlayerPoints): number {
    return this.getBattleResult(player)?.extraPoints || 0;
  }

  getTime(player: IPlayerPoints): number {
    return this.getBattleResult(player)?.time || 0;
  }

  getBattleScore(player: IPlayerPoints): number {
    return this.getBattleResult(player)?.score || 0;
  }

  generatePDF() {
    if (!this.battle) return;

    const tableBody = this.buildPdfTableBody();
    const columnCount = this.pdfColumnCount();
    const pageSize: PageSize = columnCount > 18 ? 'A3' : 'A4';
    const tableFontSize = this.safePdfTextSize();
    const documentDefinition = {
      pageSize,
      pageOrientation: this.pdfOrientation,
      pageMargins: [8, 8, 8, 8] as [number, number, number, number],
      defaultStyle: {
        fontSize: tableFontSize,
        lineHeight: 1
      },
      styles: {
        title: {
          bold: true,
          fontSize: tableFontSize + 2,
          margin: [0, 0, 0, 5] as [number, number, number, number]
        },
        tableHeader: {
          bold: true,
          fontSize: tableFontSize,
          alignment: 'center' as const
        }
      },
      content: [
        {
          text: `${this.battle.order}. ${this.battle.name}`,
          style: 'title'
        },
        {
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths: this.pdfColumnWidths(),
            body: [
              this.buildPdfHeader(),
              ...tableBody
            ]
          },
          layout: {
            hLineWidth: () => 0.35,
            vLineWidth: () => 0.35,
            paddingLeft: () => 1.2,
            paddingRight: () => 1.2,
            paddingTop: () => 1,
            paddingBottom: () => 1
          }
        }
      ]
    };

    pdfMake.createPdf(documentDefinition).open();
  }

  buildPdfTableBody() {
    if (!this.battle) return [];

    return this.participantList.map((row, index) => {
      const obstaclePoints = this.battle!.categories.flatMap(category =>
        category.obstacles.map(obstacle => this.printObstacleValue(row, obstacle))
      );
      const penalties = this.battle!.penalties.map(penalty =>
        this.isPenaltySelected(row, penalty) ? String(penalty.score) : ''
      );

      return [
        this.pdfCell(index + 1),
        this.pdfCell(row.playerName, 'left'),
        ...obstaclePoints.map(value => this.pdfCell(value)),
        ...penalties.map(value => this.pdfCell(value)),
        this.pdfCell(this.getExtraPoints(row)),
        this.pdfCell(this.getTime(row).toFixed(2)),
        this.pdfCell(this.getBattleScore(row).toFixed(2))
      ];
    });
  }

  private buildPdfHeader() {
    if (!this.battle) return [];

    return [
      this.pdfHeaderCell(this.transloco.translate('battleTable.startOrder')),
      this.pdfHeaderCell(this.transloco.translate('battleTable.player'), 'left'),
      ...this.battle.categories.flatMap(category =>
        category.obstacles.map(obstacle => this.pdfHeaderCell(obstacle.name))
      ),
      ...this.battle.penalties.map(penalty => this.pdfHeaderCell(penalty.name)),
      this.pdfHeaderCell(this.transloco.translate('battleTable.extraPoints')),
      this.pdfHeaderCell(this.transloco.translate('battleTable.time')),
      this.pdfHeaderCell(this.transloco.translate('battleTable.battleScore'))
    ];
  }

  private pdfColumnCount(): number {
    if (!this.battle) return 0;

    return 2 +
      this.battle.categories.reduce((total, category) => total + category.obstacles.length, 0) +
      this.battle.penalties.length +
      3;
  }

  private pdfColumnWidths(): Array<number | string> {
    if (!this.battle) return [];

    const dynamicColumnCount = this.pdfColumnCount() - 2;
    const isVeryWide = this.pdfColumnCount() > 28;
    const scale = this.pdfColumnScale();
    const valueWidth = Math.round((isVeryWide ? 18 : 22) * scale);

    return [
      Math.round((isVeryWide ? 14 : 18) * scale),
      Math.round((isVeryWide ? 58 : 76) * scale),
      ...Array.from({ length: dynamicColumnCount }, () => valueWidth)
    ];
  }

  private safePdfTextSize(): number {
    const value = Number(this.pdfTextSize || 5.4);
    return Math.min(14, Math.max(4, value));
  }

  private pdfColumnScale(): number {
    return Math.min(1.35, Math.max(0.72, this.safePdfTextSize() / 6));
  }

  private pdfHeaderCell(text: string, alignment: 'left' | 'center' = 'center') {
    return {
      text: text || '',
      style: 'tableHeader',
      alignment,
      noWrap: false
    };
  }

  private pdfCell(value: string | number, alignment: 'left' | 'center' = 'center') {
    return {
      text: String(value ?? ''),
      alignment,
      noWrap: false
    };
  }

  private setObstacleValue(player: IPlayerPoints, obstacle: IBattleObstacle, value: string): void {
    this.updateBattleResult(player, {
      obstacleResults: this.buildObstacleResults(player).map(result =>
        result.obstacleId === obstacle._id ? { ...result, value } : result
      )
    });
  }

  private setPenaltyValue(player: IPlayerPoints, penalty: IBattlePenalty, selected: boolean): void {
    this.updateBattleResult(player, {
      penaltyResults: this.buildPenaltyResults(player).map(result =>
        result.penaltyId === penalty._id ? { ...result, selected } : result
      )
    });
  }

  private updateBattleResult(player: IPlayerPoints, patch: Partial<IBattleResult>): void {
    if (!player._id || !this.battle?._id) return;

    const payload: Partial<IBattleResult> = {
      extraPoints: patch.extraPoints ?? this.getExtraPoints(player),
      time: patch.time ?? this.getTime(player),
      obstacleResults: patch.obstacleResults ?? this.buildObstacleResults(player),
      penaltyResults: patch.penaltyResults ?? this.buildPenaltyResults(player)
    };

    const optimisticResult = this.optimisticBattleResult(player, payload);
    this.replaceBattleResult(player, optimisticResult);

    this.offlineSync.mutate<IBattleResult>({
      type: 'battleResult.update',
      entityId: `${player._id}:${this.battle._id}`,
      tournamentId: this.tournamentId,
      baseRevision: this.getBattleResult(player)?.revision || 0,
      payload: {
        playerPointsId: player._id,
        battleId: this.battle._id,
        body: payload
      }
    }, optimisticResult).subscribe({
      next: outcome => {
        if (outcome.result) {
          this.replaceBattleResult(player, outcome.result);
        }
        this.syncStatusMessage = outcome.status === 'queued'
          ? this.transloco.translate('offline.queued')
          : outcome.status === 'conflict'
            ? this.transloco.translate('offline.syncError')
            : '';
      },
      error: error => {
        this.syncStatusMessage = this.transloco.translate('battleTable.saveError');
        console.error(this.transloco.translate('battleTable.saveError'), error);
      }
    });
  }

  private buildObstacleResults(player: IPlayerPoints): Array<{ obstacleId: string; value: string }> {
    if (!this.battle) return [];

    return this.battle.categories.flatMap(category =>
      category.obstacles
        .filter(obstacle => !!obstacle._id)
        .map(obstacle => ({
          obstacleId: obstacle._id!,
          value: this.getObstacleValue(player, obstacle)
        }))
    );
  }

  private buildPenaltyResults(player: IPlayerPoints): Array<{ penaltyId: string; selected: boolean }> {
    if (!this.battle) return [];

    return this.battle.penalties
      .filter(penalty => !!penalty._id)
      .map(penalty => ({
        penaltyId: penalty._id!,
        selected: this.isPenaltySelected(player, penalty)
      }));
  }

  private getBattleResult(player: IPlayerPoints): IBattleResult | undefined {
    return player.battleResults?.find(result => result.battleId === this.battleId);
  }

  private replaceBattleResult(player: IPlayerPoints, result: IBattleResult): void {
    const participantIndex = this.participantList.findIndex(participant => participant._id === player._id);
    if (participantIndex === -1) return;

    const participant = this.participantList[participantIndex];
    const battleResults = [...(participant.battleResults || [])];
    const resultIndex = battleResults.findIndex(item => item.battleId === result.battleId);

    if (resultIndex >= 0) {
      battleResults[resultIndex] = result;
    } else {
      battleResults.push(result);
    }

    const totalScore = this.roundScore(battleResults.reduce((total, battleResult) => total + (battleResult.score || 0), 0));
    this.participantList[participantIndex] = {
      ...participant,
      battleResults,
      totalScore,
      score: totalScore
    };
    this.participantList = [...this.participantList];
  }

  private loadCachedTournament(tournamentId: string): void {
    this.offlineSync.cachedTournament<any>(tournamentId).subscribe(snapshot => {
      if (!snapshot) {
        this.loading = false;
        this.errorMessage = this.transloco.translate('battleTable.loadError');
        return;
      }

      this.syncStatusMessage = this.transloco.translate('offline.pendingShort');
      this.applyLoadedData(snapshot.battles || [], snapshot.participants || [], snapshot.liveState || this.liveState);
    });
  }

  private applyLoadedData(battles: IBattle[], participants: IPlayerPoints[], liveState: ITournamentLiveState): void {
    this.loading = false;
    this.battles = battles;
    this.battle = battles.find(item => item._id === this.battleId);
    this.liveState = liveState;
    this.connectRealtime();

    if (!this.battle) {
      this.participantList = [];
      this.errorMessage = this.transloco.translate('battleTable.noBattle');
      return;
    }

    this.participantList = participants
      .map(participant => ({
        ...participant,
        score: this.roundScore(participant.totalScore || this.sumBattleScores(participant))
      }))
      .sort((a, b) => this.scoreBeforeCurrentBattle(b) - this.scoreBeforeCurrentBattle(a));

    this.ensureCurrentTabIsActiveBattle();
  }

  private ensureCurrentTabIsActiveBattle(): void {
    if (!this.tournamentId || !this.battleId || this.liveState.activeBattleId === this.battleId) return;

    this.updateTournamentLiveState({
      activeBattleId: this.battleId
    });
  }

  private updateTournamentLiveState(payload: {
    activeTournamentPlayerId?: string | null;
    activeBattleId?: string | null;
  }): void {
    if (!this.tournamentId) return;

    const baseRevision = this.liveState.version || 0;
    const optimisticState = this.optimisticLiveState(payload);
    this.liveState = optimisticState;
    this.cacheLiveState(optimisticState);

    this.offlineSync.mutate<ITournamentLiveState>({
      type: 'tournamentLiveState.update',
      entityId: this.tournamentId,
      tournamentId: this.tournamentId,
      baseRevision,
      payload
    }, optimisticState).subscribe({
      next: outcome => {
        if (outcome.result) {
          this.liveState = outcome.result;
          this.cacheLiveState(outcome.result);
        }
        this.syncStatusMessage = outcome.status === 'queued'
          ? this.transloco.translate('offline.queued')
          : outcome.status === 'conflict'
            ? this.transloco.translate('offline.syncError')
            : '';
      },
      error: error => {
        this.syncStatusMessage = this.transloco.translate('judge.liveStateSaveError');
        console.error(this.transloco.translate('judge.liveStateSaveError'), error);
      }
    });
  }

  private cacheLiveState(liveState: ITournamentLiveState): void {
    this.offlineSync.updateCachedTournamentLiveState(this.tournamentId, liveState).subscribe();
  }

  private optimisticLiveState(payload: {
    activeTournamentPlayerId?: string | null;
    activeBattleId?: string | null;
  }): ITournamentLiveState {
    const activeTournamentPlayerId =
      payload.activeTournamentPlayerId !== undefined
        ? payload.activeTournamentPlayerId
        : this.liveState.activeTournamentPlayerId;
    const activeBattleId =
      payload.activeBattleId !== undefined
        ? payload.activeBattleId
        : this.liveState.activeBattleId;

    return {
      ...this.liveState,
      tournamentId: this.tournamentId,
      activeTournamentPlayerId,
      activeBattleId,
      activeParticipant: activeTournamentPlayerId ? this.activeParticipantSummary(activeTournamentPlayerId) : null,
      activeBattle: activeBattleId ? this.activeBattleSummary(activeBattleId) : null,
      version: (this.liveState.version || 0) + 1
    };
  }

  private activeParticipantSummary(activeTournamentPlayerId: string): ITournamentLiveState['activeParticipant'] {
    const participant = this.participantList.find(item => item._id === activeTournamentPlayerId);
    if (!participant?._id) return this.liveState.activeParticipant;

    return {
      _id: participant._id,
      playerName: participant.playerName || '',
      horse: participant.horse || '',
      order: participant.order || 0
    };
  }

  private activeBattleSummary(activeBattleId: string): ITournamentLiveState['activeBattle'] {
    const battle = this.battles.find(item => item._id === activeBattleId);
    if (!battle?._id) return this.liveState.activeBattle;

    return {
      _id: battle._id,
      name: battle.name || '',
      order: battle.order || 0
    };
  }

  private optimisticBattleResult(player: IPlayerPoints, payload: Partial<IBattleResult>): IBattleResult {
    const current = this.getBattleResult(player);
    const obstacleResults = payload.obstacleResults ?? this.buildObstacleResults(player);
    const penaltyResults = payload.penaltyResults ?? this.buildPenaltyResults(player);
    const extraPoints = Number(payload.extraPoints ?? this.getExtraPoints(player));
    const time = Number(payload.time ?? this.getTime(player));
    const scoredObstacleResults = obstacleResults.map(result => ({
      ...result,
      score: this.optimisticObstacleScore(result.obstacleId, result.value)
    }));
    const scoredPenaltyResults = penaltyResults.map(result => ({
      ...result,
      score: this.optimisticPenaltyScore(result.penaltyId, result.selected)
    }));
    const score =
      scoredObstacleResults.reduce((total, result) => total + (result.score || 0), 0) +
      scoredPenaltyResults.reduce((total, result) => total + (result.score || 0), 0) +
      extraPoints +
      time;

    return {
      _id: current?._id,
      battleId: this.battleId,
      tournamentPlayerId: player._id,
      extraPoints,
      time,
      score: this.roundScore(score),
      revision: current?.revision || 0,
      obstacleResults: scoredObstacleResults,
      penaltyResults: scoredPenaltyResults
    };
  }

  private optimisticObstacleScore(obstacleId: string, value: string): number {
    const obstacle = this.battle?.categories
      .flatMap(category => category.obstacles)
      .find(item => item._id === obstacleId);
    if (!obstacle) return 0;

    if (this.isSelectObstacle(obstacle)) {
      return obstacle.scoreOptions?.find(option => option.code === value)?.score || 0;
    }

    return value === '1' ? Number(obstacle.score || 0) : 0;
  }

  private optimisticPenaltyScore(penaltyId: string, selected: boolean): number {
    const penalty = this.battle?.penalties.find(item => item._id === penaltyId);
    return selected ? Number(penalty?.score || 0) : 0;
  }

  private scoreBeforeCurrentBattle(player: IPlayerPoints): number {
    const currentOrder = this.battle?.order || 0;
    const orderByBattleId = new Map(this.battles.map(battle => [battle._id, battle.order]));

    return (player.battleResults || []).reduce((total, result) => {
      const order = orderByBattleId.get(result.battleId);
      return order && order < currentOrder ? total + (result.score || 0) : total;
    }, 0);
  }

  private sumBattleScores(player: IPlayerPoints): number {
    return this.roundScore((player.battleResults || []).reduce((total, result) => total + (result.score || 0), 0));
  }

  private roundScore(value: number): number {
    return Number((value || 0).toFixed(3));
  }

  private printObstacleValue(player: IPlayerPoints, obstacle: IBattleObstacle): string {
    const value = this.getObstacleValue(player, obstacle);
    if (this.isSelectObstacle(obstacle)) {
      return obstacle.scoreOptions?.find(option => option.code === value)?.label || value;
    }

    return value === '1' ? 'X' : '';
  }
}
