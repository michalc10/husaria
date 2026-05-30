import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { Subscription } from 'rxjs';
import { toDataURL } from 'qrcode';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { PageOrientation } from 'pdfmake/interfaces';
import { IBattle, IBattleObstacle, IBattlePenalty, IBattleResult } from 'src/app/models/battle';
import { IBattleLiveState, IJudgeStation, IJudgeStationCategory } from 'src/app/models/judgeStation';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import { JudgeStationService } from '../../services/judge-station/judge-station.service';
import { LiveScoreSocketService } from '../../services/live-score-socket/live-score-socket.service';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';
import { TournamentService } from '../../services/tournament/tournament.service';

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
  stationCategories: IJudgeStationCategory[] = [];
  onlineStationIds = new Set<string>();
  liveState: IBattleLiveState = {
    battleId: '',
    activeTournamentPlayerId: null,
    version: 0,
    activeParticipant: null
  };
  qrDialogVisible = false;
  qrCodeDataUrl = '';
  qrGuestUrl = '';
  qrStationLabel = '';

  private liveSubscription = new Subscription();

  constructor(
    private playerPointsService: PlayerPointsService,
    private route: ActivatedRoute,
    private tournamentService: TournamentService,
    private transloco: TranslocoService,
    private judgeStationService: JudgeStationService,
    private liveScoreSocket: LiveScoreSocketService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.resetComponentState();
      this.battleId = params.get('battleId') || '';

      const tournamentId = this.getTournamentId();
      if (tournamentId && this.battleId) {
        this.loadBattleAndParticipants(tournamentId);
      } else {
        console.error(this.transloco.translate('battleTable.missingRoute'));
      }
    });
  }

  ngOnDestroy(): void {
    this.liveSubscription.unsubscribe();
    this.liveScoreSocket.disconnect();
  }

  resetComponentState() {
    this.selectedPlayerId = '-1';
    this.selectedColumnKey = '';
    this.participantList = [];
    this.battles = [];
    this.battle = undefined;
    this.battleId = '';
    this.stationCategories = [];
    this.onlineStationIds.clear();
    this.liveState = {
      battleId: '',
      activeTournamentPlayerId: null,
      version: 0,
      activeParticipant: null
    };
    this.liveSubscription.unsubscribe();
    this.liveSubscription = new Subscription();
  }

  private getTournamentId(): string | null {
    return this.route.parent?.snapshot.paramMap.get('idTournament') ?? null;
  }

  loadBattleAndParticipants(tournamentId: string): void {
    forkJoin({
      battles: this.tournamentService.getBattles(tournamentId),
      participants: this.playerPointsService.getPlayerPointsForTournament(tournamentId),
      stations: this.judgeStationService.listForBattle(this.battleId),
      liveState: this.judgeStationService.getLiveState(this.battleId)
    }).subscribe({
      next: ({ battles, participants, stations, liveState }) => {
        this.battles = battles;
        this.battle = battles.find(item => item._id === this.battleId);
        this.stationCategories = stations.categories;
        this.liveState = liveState;
        this.connectRealtime();

        if (!this.battle) {
          this.participantList = [];
          return;
        }

        this.participantList = participants
          .map(participant => ({
            ...participant,
            score: this.roundScore(participant.totalScore || this.sumBattleScores(participant))
          }))
          .sort((a, b) => this.scoreBeforeCurrentBattle(b) - this.scoreBeforeCurrentBattle(a));
      },
      error: error => {
        console.error(this.transloco.translate('battleTable.loadError'), error);
      }
    });
  }

  isActiveParticipant(player: IPlayerPoints): boolean {
    return !!player._id && this.liveState.activeTournamentPlayerId === player._id;
  }

  setActiveParticipant(playerId: string | null): void {
    if (!this.battleId) return;

    this.judgeStationService.updateLiveState(this.battleId, playerId).subscribe({
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

  activeParticipantIndex(): number {
    return this.participantList.findIndex(player => player._id === this.liveState.activeTournamentPlayerId);
  }

  createOrShowStation(categoryItem: IJudgeStationCategory): void {
    const categoryId = categoryItem.category._id;
    if (!categoryId || !this.battleId) return;

    this.judgeStationService.createOrRegenerate(this.battleId, categoryId).subscribe({
      next: station => {
        categoryItem.station = station;
        this.openQr(station);
      },
      error: error => {
        console.error(this.transloco.translate('judge.stationSaveError'), error);
      }
    });
  }

  revokeStation(categoryItem: IJudgeStationCategory): void {
    const stationId = categoryItem.station?._id;
    if (!stationId) return;

    this.judgeStationService.revoke(stationId).subscribe({
      next: station => {
        categoryItem.station = station;
        this.onlineStationIds.delete(station._id);
      },
      error: error => {
        console.error(this.transloco.translate('judge.stationRevokeError'), error);
      }
    });
  }

  isStationOnline(station: IJudgeStation | null): boolean {
    return !!station?._id && this.onlineStationIds.has(station._id);
  }

  stationLastSeen(station: IJudgeStation | null): string {
    if (!station?.lastSeenAt) return this.transloco.translate('judge.neverSeen');
    return new Date(station.lastSeenAt).toLocaleString();
  }

  private openQr(station: IJudgeStation): void {
    if (!station.guestUrl) return;

    this.qrStationLabel = station.label;
    this.qrGuestUrl = station.guestUrl;
    toDataURL(station.guestUrl, { width: 320, margin: 2 }).then(dataUrl => {
      this.qrCodeDataUrl = dataUrl;
      this.qrDialogVisible = true;
    });
  }

  private connectRealtime(): void {
    this.liveSubscription.unsubscribe();
    this.liveSubscription = new Subscription();
    this.liveScoreSocket.joinBattle(this.battleId);

    this.liveSubscription.add(
      this.liveScoreSocket.liveState$.subscribe(state => {
        if (state.battleId === this.battleId) {
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

    this.liveSubscription.add(
      this.liveScoreSocket.stationPresence$.subscribe(presence => {
        if (presence.online) {
          this.onlineStationIds.add(presence.stationId);
        } else {
          this.onlineStationIds.delete(presence.stationId);
        }

        this.stationCategories = this.stationCategories.map(item => {
          if (!item.station || item.station._id !== presence.stationId) return item;

          return {
            ...item,
            station: {
              ...item.station,
              lastSeenAt: presence.lastSeenAt || item.station.lastSeenAt
            }
          };
        });
      })
    );

    this.liveSubscription.add(
      this.liveScoreSocket.stationRevoked$.subscribe(payload => {
        if (!payload?.stationId) return;
        this.onlineStationIds.delete(payload.stationId);
        this.stationCategories = this.stationCategories.map(item => {
          if (!item.station || item.station._id !== payload.stationId) return item;

          return {
            ...item,
            station: {
              ...item.station,
              revokedAt: new Date()
            }
          };
        });
      })
    );
  }

  chosenRow(player: IPlayerPoints) {
    this.selectedPlayerId = player._id!;
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

    const tableBody = this.buildTableBody();
    const documentDefinition = {
      pageOrientation: 'landscape' as PageOrientation,
      content: [
        {
          table: {
            headerRows: 1,
            body: [
              [
                { text: this.transloco.translate('battleTable.startOrder'), bold: true },
                { text: this.transloco.translate('battleTable.player'), bold: true },
                ...this.battle.categories.flatMap(category =>
                  category.obstacles.map(obstacle => ({ text: obstacle.name, bold: true }))
                ),
                ...this.battle.penalties.map(penalty => ({ text: penalty.name, bold: true })),
                { text: this.transloco.translate('battleTable.extraPoints'), bold: true },
                { text: this.transloco.translate('battleTable.time'), bold: true },
                { text: this.transloco.translate('battleTable.battleScore'), bold: true }
              ],
              ...tableBody
            ]
          }
        }
      ]
    };

    pdfMake.createPdf(documentDefinition).open();
  }

  buildTableBody() {
    if (!this.battle) return [];

    return this.participantList.map((row, index) => {
      const obstaclePoints = this.battle!.categories.flatMap(category =>
        category.obstacles.map(obstacle => this.printObstacleValue(row, obstacle))
      );
      const penalties = this.battle!.penalties.map(penalty =>
        this.isPenaltySelected(row, penalty) ? String(penalty.score) : ''
      );

      return [
        index + 1,
        row.playerName,
        ...obstaclePoints,
        ...penalties,
        this.getExtraPoints(row),
        this.getTime(row),
        this.getBattleScore(row).toFixed(3)
      ];
    });
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

    this.playerPointsService.updateBattleResult(player._id, this.battle._id, payload).subscribe({
      next: updatedResult => {
        this.replaceBattleResult(player, updatedResult);
      },
      error: error => {
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
