import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { IBattleObstacle, IBattleResult } from 'src/app/models/battle';
import { IJudgeSession } from 'src/app/models/judgeStation';
import { JudgeStationService } from '../turnament/services/judge-station/judge-station.service';
import { LiveScoreSocketService } from '../turnament/services/live-score-socket/live-score-socket.service';

@Component({
  selector: 'app-judge-mobile',
  templateUrl: './judge-mobile.component.html',
  styleUrls: ['./judge-mobile.component.scss'],
  standalone: false
})
export class JudgeMobileComponent implements OnInit, OnDestroy {
  token = '';
  session?: IJudgeSession;
  connected = false;
  revoked = false;
  loading = true;
  saving = false;
  statusMessage = '';

  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private judgeStationService: JudgeStationService,
    private liveScoreSocket: LiveScoreSocketService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.loadSession();
    this.liveScoreSocket.joinStation(this.token);

    this.subscription.add(this.liveScoreSocket.connected$.subscribe(connected => (this.connected = connected)));
    this.subscription.add(
      this.liveScoreSocket.liveState$.subscribe(state => {
        if (this.session && state.battleId === this.session.battle._id) {
          this.session = {
            ...this.session,
            liveState: state,
            result: null
          };
          this.loadSession(false);
        }
      })
    );
    this.subscription.add(
      this.liveScoreSocket.battleResult$.subscribe(result => {
        if (
          this.session &&
          result.battleId === this.session.battle._id &&
          result.tournamentPlayerId === this.session.liveState.activeTournamentPlayerId
        ) {
          this.session = {
            ...this.session,
            result
          };
        }
      })
    );
    this.subscription.add(
      this.liveScoreSocket.stationRevoked$.subscribe(() => {
        this.revoked = true;
        this.statusMessage = 'Link stanowiska został unieważniony.';
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.liveScoreSocket.disconnect();
  }

  loadSession(showLoader = true): void {
    if (showLoader) this.loading = true;

    this.judgeStationService.getSession(this.token).subscribe({
      next: session => {
        this.session = session;
        this.revoked = false;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.revoked = true;
        this.statusMessage = 'Nieprawidłowy albo wygasły link stanowiska.';
      }
    });
  }

  getObstacleValue(obstacle: IBattleObstacle): string {
    const obstacleId = obstacle._id;
    if (!obstacleId) return '0';
    return this.session?.result?.obstacleResults.find(result => result.obstacleId === obstacleId)?.value || '0';
  }

  setToggleObstacle(obstacle: IBattleObstacle): void {
    const nextValue = this.getObstacleValue(obstacle) === '1' ? '0' : '1';
    this.saveObstacle(obstacle, nextValue);
  }

  setSelectObstacle(obstacle: IBattleObstacle, value: string): void {
    this.saveObstacle(obstacle, value || '0');
  }

  isSelectObstacle(obstacle: IBattleObstacle): boolean {
    return obstacle.inputType === 'select';
  }

  optionLabel(obstacle: IBattleObstacle, value: string): string {
    return obstacle.scoreOptions?.find(option => option.code === value)?.label || value;
  }

  private saveObstacle(obstacle: IBattleObstacle, value: string): void {
    if (!this.session?.liveState.activeTournamentPlayerId || !obstacle._id) return;

    this.saving = true;
    const values = new Map(
      (this.session.result?.obstacleResults || []).map(result => [result.obstacleId, result.value])
    );
    values.set(obstacle._id, value);

    this.judgeStationService.updateSessionResult(this.token, {
      liveStateVersion: this.session.liveState.version,
      obstacleResults: this.session.category.obstacles
        .filter(item => !!item._id)
        .map(item => ({
          obstacleId: item._id!,
          value: values.get(item._id!) || '0'
        }))
    }).subscribe({
      next: result => {
        this.applyResult(result);
        this.saving = false;
        this.statusMessage = 'Zapisano.';
      },
      error: error => {
        this.saving = false;
        this.statusMessage = error?.status === 409
          ? 'Zawodnik zmienił się w trakcie zapisu. Odświeżam stanowisko.'
          : 'Nie udało się zapisać wyniku.';
        this.loadSession(false);
      }
    });
  }

  private applyResult(result: IBattleResult): void {
    if (!this.session) return;
    this.session = {
      ...this.session,
      result
    };
  }
}
