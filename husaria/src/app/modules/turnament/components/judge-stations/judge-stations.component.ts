import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import { toDataURL } from 'qrcode';
import { IBattle, IBattleCategory } from 'src/app/models/battle';
import { IJudgeStation, IJudgeStationAssignment } from 'src/app/models/judgeStation';
import { JudgeStationService } from '../../services/judge-station/judge-station.service';
import { IStationResultSaved, LiveScoreSocketService } from '../../services/live-score-socket/live-score-socket.service';

@Component({
  selector: 'app-judge-stations',
  templateUrl: './judge-stations.component.html',
  styleUrls: ['./judge-stations.component.scss'],
  standalone: false
})
export class JudgeStationsComponent implements OnInit, OnDestroy {
  tournamentId = '';
  battles: IBattle[] = [];
  stations: IJudgeStation[] = [];
  onlineStationIds = new Set<string>();
  lastResultSavedByStationId = new Map<string, IStationResultSaved>();
  loading = true;
  saving = false;
  statusMessage = '';
  editingStationId: string | null = null;
  formLabel = '';
  selectedAssignments: IJudgeStationAssignment[] = [];
  selectedBattleId = '';
  selectedCategoryId = '';
  qrDialogVisible = false;
  qrCodeDataUrl = '';
  qrGuestUrl = '';
  qrStationLabel = '';

  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private judgeStationService: JudgeStationService,
    private liveScoreSocket: LiveScoreSocketService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    this.tournamentId = this.route.parent?.snapshot.paramMap.get('idTournament') || '';
    this.load();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  load(): void {
    if (!this.tournamentId) return;
    this.loading = true;

    this.judgeStationService.listForTournament(this.tournamentId).subscribe({
      next: stationList => {
        this.battles = stationList.battles;
        this.stations = stationList.stations;
        this.loading = false;
        this.connectRealtime();
        if (!this.editingStationId && !this.stations.length) {
          this.startCreate();
        }
      },
      error: error => {
        this.loading = false;
        this.statusMessage = this.transloco.translate('judge.stationsLoadError');
        console.error(this.statusMessage, error);
      }
    });
  }

  startCreate(): void {
    this.editingStationId = null;
    this.formLabel = `QR code ${this.stations.length + 1}`;
    this.selectedAssignments = [];
    this.selectedBattleId = this.firstBattleWithAvailableCategory()?._id || this.battles[0]?._id || '';
    this.selectedCategoryId = this.availableCategoriesForSelectedBattle()[0]?._id || '';
  }

  startEdit(station: IJudgeStation): void {
    this.editingStationId = station._id;
    this.formLabel = station.label || '';
    this.selectedAssignments = this.stationAssignments(station);
    this.selectedBattleId = this.firstBattleWithAvailableCategory()?._id || this.battles[0]?._id || '';
    this.selectedCategoryId = this.availableCategoriesForSelectedBattle()[0]?._id || '';
  }

  cancelEdit(): void {
    this.editingStationId = null;
    this.formLabel = '';
    this.selectedAssignments = [];
    this.selectedBattleId = '';
    this.selectedCategoryId = '';
  }

  saveStation(): void {
    if (!this.selectedAssignments.length || this.saving) return;
    this.saving = true;
    const payload = {
      label: this.formLabel.trim(),
      assignments: this.selectedAssignments.map(assignment => ({
        battleId: assignment.battleId,
        categoryId: assignment.categoryId
      }))
    };
    const request = this.editingStationId
      ? this.judgeStationService.update(this.editingStationId, payload)
      : this.judgeStationService.create(this.tournamentId, payload);

    request.subscribe({
      next: station => {
        this.saving = false;
        this.upsertStation(station);
        this.statusMessage = this.transloco.translate('judge.stationSaved');
        if (station.guestUrl) {
          this.openQr(station);
        }
        this.startCreate();
      },
      error: error => {
        this.saving = false;
        this.statusMessage = error?.error?.message || this.transloco.translate('judge.stationSaveError');
        console.error(this.statusMessage, error);
      }
    });
  }

  regenerateStation(station: IJudgeStation): void {
    if (!window.confirm(this.transloco.translate('judge.regenerateConfirm'))) return;

    this.judgeStationService.regenerateToken(station._id).subscribe({
      next: updated => {
        this.upsertStation(updated);
        this.openQr(updated);
      },
      error: error => {
        console.error(this.transloco.translate('judge.stationSaveError'), error);
      }
    });
  }

  revokeStation(station: IJudgeStation): void {
    if (!window.confirm(this.transloco.translate('judge.revokeConfirm'))) return;

    this.judgeStationService.revoke(station._id).subscribe({
      next: updated => {
        this.upsertStation(updated);
        this.onlineStationIds.delete(updated._id);
        this.refreshSelectedCategory();
      },
      error: error => {
        console.error(this.transloco.translate('judge.stationRevokeError'), error);
      }
    });
  }

  onBattleChange(): void {
    this.selectedCategoryId = this.availableCategoriesForSelectedBattle()[0]?._id || '';
  }

  addAssignment(): void {
    const battle = this.battles.find(item => item._id === this.selectedBattleId);
    const category = battle?.categories.find(item => item._id === this.selectedCategoryId);
    if (!battle?._id || !category?._id || this.isCategorySelected(category._id)) return;

    this.selectedAssignments = [
      ...this.selectedAssignments,
      {
        battleId: battle._id,
        categoryId: category._id,
        battleName: battle.name,
        battleOrder: battle.order,
        categoryName: category.name,
        categoryOrder: category.order
      }
    ].sort((left, right) => (left.battleOrder || 0) - (right.battleOrder || 0) || (left.categoryOrder || 0) - (right.categoryOrder || 0));
    this.refreshSelectedCategory();
  }

  removeAssignment(categoryId: string): void {
    this.selectedAssignments = this.selectedAssignments.filter(assignment => assignment.categoryId !== categoryId);
    this.refreshSelectedCategory();
  }

  availableCategoriesForSelectedBattle(): IBattleCategory[] {
    const battle = this.battles.find(item => item._id === this.selectedBattleId);
    if (!battle) return [];
    const occupiedCategoryIds = this.occupiedCategoryIds();
    const selectedCategoryIds = new Set(this.selectedAssignments.map(assignment => assignment.categoryId));
    return battle.categories.filter(category =>
      !!category._id &&
      !occupiedCategoryIds.has(category._id) &&
      !selectedCategoryIds.has(category._id)
    );
  }

  stationAssignmentNames(station: IJudgeStation): string {
    const assignments = this.stationAssignments(station);
    if (!assignments.length) return this.transloco.translate('common.dash');
    return assignments.map(assignment => this.assignmentLabel(assignment)).join(', ');
  }

  assignmentLabel(assignment: IJudgeStationAssignment): string {
    const battle = this.battles.find(item => item._id === assignment.battleId);
    const category = battle?.categories.find(item => item._id === assignment.categoryId);
    const battleOrder = assignment.battleOrder || battle?.order || '';
    const battleName = assignment.battleName || battle?.name || '';
    const categoryName = assignment.categoryName || category?.name || '';
    return `${battleOrder ? `${battleOrder}. ` : ''}${battleName} - ${categoryName}`.trim();
  }

  isStationOnline(station: IJudgeStation): boolean {
    return this.onlineStationIds.has(station._id);
  }

  stationLastSeen(station: IJudgeStation): string {
    if (!station.lastSeenAt) return this.transloco.translate('judge.neverSeen');
    return new Date(station.lastSeenAt).toLocaleString();
  }

  stationLastSaved(station: IJudgeStation): string {
    const saved = this.lastResultSavedByStationId.get(station._id);
    if (!saved?.savedAt) return this.transloco.translate('judge.noSavedResults');
    return new Date(saved.savedAt).toLocaleString();
  }

  stationLastSavedBattle(station: IJudgeStation): string {
    const saved = this.lastResultSavedByStationId.get(station._id);
    if (!saved?.battleId) return '';
    return this.battles.find(battle => battle._id === saved.battleId)?.name || '';
  }

  openQr(station: IJudgeStation): void {
    if (!station.guestUrl) {
      this.statusMessage = this.transloco.translate('judge.qrUnavailable');
      return;
    }

    this.qrStationLabel = station.label;
    this.qrGuestUrl = station.guestUrl;
    toDataURL(station.guestUrl, { width: 320, margin: 2 }).then(dataUrl => {
      this.qrCodeDataUrl = dataUrl;
      this.qrDialogVisible = true;
    });
  }

  private connectRealtime(): void {
    this.subscription.unsubscribe();
    this.subscription = new Subscription();
    this.liveScoreSocket.joinTournament(this.tournamentId);

    this.subscription.add(
      this.liveScoreSocket.stationPresence$.subscribe(presence => {
        if (presence.online) {
          this.onlineStationIds.add(presence.stationId);
        } else {
          this.onlineStationIds.delete(presence.stationId);
        }

        this.stations = this.stations.map(station =>
          station._id === presence.stationId
            ? {
                ...station,
                lastSeenAt: presence.lastSeenAt || station.lastSeenAt
              }
            : station
        );
      })
    );

    this.subscription.add(
      this.liveScoreSocket.stationResultSaved$.subscribe(payload => {
        this.lastResultSavedByStationId.set(payload.stationId, payload);
        this.stations = this.stations.map(station =>
          station._id === payload.stationId
            ? {
                ...station,
                lastSeenAt: payload.savedAt || station.lastSeenAt
              }
            : station
        );
      })
    );

    this.subscription.add(
      this.liveScoreSocket.stationRevoked$.subscribe(payload => {
        if (!payload?.stationId) return;
        this.onlineStationIds.delete(payload.stationId);
        this.stations = this.stations.map(station =>
          station._id === payload.stationId ? { ...station, revokedAt: new Date() } : station
        );
        this.refreshSelectedCategory();
      })
    );
  }

  private upsertStation(station: IJudgeStation): void {
    const index = this.stations.findIndex(item => item._id === station._id);
    if (index >= 0) {
      this.stations[index] = station;
      this.stations = [...this.stations];
      return;
    }

    this.stations = [station, ...this.stations];
  }

  private stationAssignments(station: IJudgeStation): IJudgeStationAssignment[] {
    if (station.assignments?.length) {
      return station.assignments.map(assignment => ({ ...assignment }));
    }

    return (station.battleIds || []).flatMap(battleId => {
      const battle = this.battles.find(item => item._id === battleId);
      return (battle?.categories || []).filter(category => !!category._id).map(category => ({
        battleId,
        categoryId: category._id!,
        battleName: battle?.name,
        battleOrder: battle?.order,
        categoryName: category.name,
        categoryOrder: category.order
      }));
    });
  }

  private occupiedCategoryIds(): Set<string> {
    return new Set(
      this.stations
        .filter(station => !station.revokedAt && station._id !== this.editingStationId)
        .flatMap(station => this.stationAssignments(station).map(assignment => assignment.categoryId))
    );
  }

  private isCategorySelected(categoryId: string): boolean {
    return this.selectedAssignments.some(assignment => assignment.categoryId === categoryId);
  }

  private firstBattleWithAvailableCategory(): IBattle | undefined {
    return this.battles.find(battle => battle.categories.some(category => {
      const categoryId = category._id;
      return !!categoryId && !this.occupiedCategoryIds().has(categoryId) && !this.isCategorySelected(categoryId);
    }));
  }

  private refreshSelectedCategory(): void {
    if (!this.selectedBattleId || !this.availableCategoriesForSelectedBattle().length) {
      this.selectedBattleId = this.firstBattleWithAvailableCategory()?._id || this.battles[0]?._id || '';
    }
    this.selectedCategoryId = this.availableCategoriesForSelectedBattle()[0]?._id || '';
  }
}
