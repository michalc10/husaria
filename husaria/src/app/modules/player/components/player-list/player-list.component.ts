import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Table } from 'primeng/table';
import { ConfirmationService } from 'primeng/api';
import { IPlayer } from 'src/app/models/player';
import { CrudService } from 'src/app/shered/service/crud.service';

@Component({
  selector: 'app-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class PlayerListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  readonly playerRoute = 'player';

  playerList: IPlayer[] = [];
  selectedPlayer: IPlayer = { name: '', horse: '', flag: '', _id: '-1' };

  display = false; // widoczność dialogu

  constructor(
    private crudService: CrudService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadPlayers();
  }

  loadPlayers(): void {
    this.crudService.list<IPlayer>(this.playerRoute).subscribe({
      next: (players) => (this.playerList = players),
      error: (err) => console.error('Nie udało się pobrać listy husarzy', err)
    });
  }

  onGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dt.filterGlobal(value, 'contains');
  }

  createPlayer(): void {
    this.selectedPlayer = { name: '', horse: '', flag: '', _id: '-1' };
    this.display = true;
  }

  editPlayer(player: IPlayer): void {
    // kopiujemy, by nie modyfikować listy w trakcie edycji
    this.selectedPlayer = { ...player };
    this.display = true;
  }

  // z dziecka: zamknięcie bez zapisu
  closedDialogWithoutSaving(_: boolean): void {
    this.display = false;
  }

  // z dziecka: zapis
  returnFromChild(player: IPlayer): void {
    this.display = false;

    if (player._id === '-1') {
      // CREATE
      const { _id, ...payload } = player; // opcjonalnie usuń sentinel
      this.crudService.create<IPlayer>(this.playerRoute, payload).subscribe({
        next: (saved) => (this.playerList = [...this.playerList, saved]),
        error: (err) => console.error('Błąd tworzenia', err)
      });
    } else {
      // UPDATE
      this.crudService.update<IPlayer>(this.playerRoute, player._id!, player).subscribe({
        next: (updated) => {
          this.playerList = this.playerList.map(p => (p._id === updated._id ? updated : p));
        },
        error: (err) => console.error('Błąd aktualizacji', err)
      });
    }
  }

  confirmDelete(event: Event, id: string): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Chcesz usunąć husarza?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.crudService.delete(this.playerRoute, id).subscribe({
          next: () => {
            this.playerList = this.playerList.filter(p => p._id !== id);
          },
          error: (err) => console.error('Błąd usuwania', err)
        });
      }
    });
  }
}