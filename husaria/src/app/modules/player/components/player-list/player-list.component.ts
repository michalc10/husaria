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
  chosenPlayer: IPlayer = { name: '', flag: '', horse: '', _id: '-1' };
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


  createPlayer() {
    this.chosenPlayer = { name: '', flag: '', horse: '', _id: '-1' }
    this.displayDialogCompnent = true;
    this.display = true;

  }

  changePlayer(player: IPlayer) {
    this.chosenPlayer = player
    this.displayDialogCompnent = true;
    this.display = true;
  }

  closedDialogWithoutSaving(bool: Boolean) {
    this.display = false;
  }

  returnFromChild(player: IPlayer) {

    this.display = false;
    // const player = event as IPlayer
    console.log(player._id)
    if (player._id === '-1') {
      this.crudService.create(this.playerRout, player).subscribe({
        next: (value: IPlayer) => {
          this.playerList.push(value)
        },
      }
      );
    } else {
      this.crudService.update(this.playerRout, player._id!, player).subscribe({
        next: (value: IPlayer) => {
          this.playerList[this.playerList.findIndex(player => player._id === value._id)] = value;
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
