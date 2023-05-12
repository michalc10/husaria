import { Component } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { IPlayer } from 'src/app/models/player';
import { CrudService } from 'src/app/shered/service/crud.service';

@Component({
  selector: 'app-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.scss']
})
export class PlayerListComponent {

  playerRout = 'player';
  playerList: IPlayer[] = [];
  idPlayer: String = '-1';
  displayDialogCompnent = false;

  display = false;

  constructor(
    private crudService: CrudService,
    private confirmationService: ConfirmationService
  ) {
    this.crudService.list('player')
      .subscribe({
        next: (value) => {
          this.playerList = value;
        },
      })
  }


  savePlayer(player: IPlayer) {

  }

  createPlayer() {
    this.idPlayer = '-1';
    this.displayDialogCompnent = true;
    this.display = true;

  }

  changePlayer(id: String) {
    this.idPlayer = id;
    this.displayDialogCompnent = true;
    this.display = true;
  }
  claseWithoutSaving(val: boolean) {
    this.displayDialogCompnent = false;
  }
  closedDialogWithoutSaving(bool: Boolean) {
    this.display = false;
  }
  returnFromChild(event: any) {

    this.display = false;
    const player = event as IPlayer
    if (this.idPlayer != '-1') {
      this.crudService.update(this.playerRout, player._id!, player).subscribe({
        next: (value: IPlayer) => {
          this.playerList.push(value)

        },
      }
      );
    } else {
      this.crudService.create(this.playerRout, player).subscribe({
        next: (value: IPlayer) => {
          this.playerList.push(value)

        },
      }
      );
    }
  }
  confirm(event: Event, id: String) {
    this.confirmationService.confirm({
      target: event.target!,
      message: 'Chcesz usunąć husarza?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.crudService.delete(this.playerRout, id).subscribe(
          {
            next: (value) => {
              this.playerList = [...this.playerList.filter((player: IPlayer) => { return player._id != id })]

            },
          }
        )
      },
      reject: () => {
      }
    });
  }
}
