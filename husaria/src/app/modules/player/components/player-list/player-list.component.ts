import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { Table } from 'primeng/table';
import { forkJoin } from 'rxjs';
import { IBanner } from 'src/app/models/banner';
import { IPlayer } from 'src/app/models/player';
import { CrudService } from 'src/app/shered/service/crud.service';

@Component({
  selector: 'app-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: false
})
export class PlayerListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  readonly playerRoute = 'player';
  readonly bannerRoute = 'banner';

  playerList: IPlayer[] = [];
  bannerList: IBanner[] = [];
  selectedPlayer: IPlayer = { name: '', horse: '', bannerId: '', _id: '-1' };
  display = false;

  constructor(
    private crudService: CrudService,
    private confirmationService: ConfirmationService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    this.loadPlayers();
  }

  loadPlayers(): void {
    forkJoin({
      players: this.crudService.list<IPlayer>(this.playerRoute),
      banners: this.crudService.list<IBanner>(this.bannerRoute)
    }).subscribe({
      next: ({ players, banners }) => {
        this.playerList = players;
        this.bannerList = banners;
      },
      error: (err) => console.error(this.transloco.translate('player.loadError'), err)
    });
  }

  onGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dt.filterGlobal(value, 'contains');
  }

  createPlayer(): void {
    this.selectedPlayer = { name: '', horse: '', bannerId: '', _id: '-1' };
    this.display = true;
  }

  editPlayer(player: IPlayer): void {
    this.selectedPlayer = { ...player };
    this.display = true;
  }

  closedDialogWithoutSaving(_: boolean): void {
    this.display = false;
  }

  returnFromChild(player: IPlayer): void {
    this.display = false;
    const payload = this.toPayload(player);

    if (player._id === '-1') {
      this.crudService.create<Partial<IPlayer>, IPlayer>(this.playerRoute, payload).subscribe({
        next: () => this.loadPlayers(),
        error: (err) => console.error(this.transloco.translate('player.saveError'), err)
      });
      return;
    }

    this.crudService.update<Partial<IPlayer>, IPlayer>(this.playerRoute, player._id!, payload).subscribe({
      next: () => this.loadPlayers(),
      error: (err) => console.error(this.transloco.translate('player.saveError'), err)
    });
  }

  confirmDelete(event: Event, id: string): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.transloco.translate('player.deleteConfirm'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.transloco.translate('common.yes'),
      rejectLabel: this.transloco.translate('common.no'),
      accept: () => {
        this.crudService.delete(this.playerRoute, id).subscribe({
          next: () => this.loadPlayers(),
          error: (err) => console.error(this.transloco.translate('player.deleteError'), err)
        });
      }
    });
  }

  bannerLabel(player: IPlayer): string {
    const name = player.bannerName || player.flag || '';
    const city = player.bannerCity || '';
    return city ? `${name} (${city})` : name || '-';
  }

  private toPayload(player: IPlayer): Partial<IPlayer> {
    return {
      name: player.name,
      horse: player.horse,
      bannerId: player.bannerId || null,
      flag: player.flag
    };
  }
}
