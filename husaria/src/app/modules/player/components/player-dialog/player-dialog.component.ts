import { Component, Input, OnInit, Output, EventEmitter, SimpleChange } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IPlayer } from 'src/app/models/player';
import { CrudService } from 'src/app/shered/service/crud.service';

@Component({
  selector: 'app-player-dialog',
  templateUrl: './player-dialog.component.html',
  styleUrls: ['./player-dialog.component.scss']
})
export class PlayerDialogComponent implements OnInit {

  playerForm: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    horse: ['', Validators.required],
    flag: [''],
    _id: ['']
  });

  @Input() display: boolean = false;
  @Input() set player(player: IPlayer) {
    this.playerForm.setValue({
      name: player.name,
      horse: player.horse,
      flag: player.flag,
      _id: player._id
    })
    this.buttonText = player._id != '-1' ? 'Zmień' : 'Dodaj'

  }
  @Output() comunication: EventEmitter<IPlayer> = new EventEmitter<IPlayer>();
  @Output() comunicationWithoutSaving: EventEmitter<Boolean> = new EventEmitter<Boolean>()


  buttonText: String = 'Add';

  constructor(
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {

  }

  onSubmit() {
    const playerData = this.playerForm.value;
    const player2: IPlayer = {
      name: playerData.name,
      horse: playerData.horse,
      flag: playerData.flag,
      _id: playerData._id
    }

    this.comunication.emit(player2);
  }

  closingWithoutSaving() {
    this.comunicationWithoutSaving.emit(true);
  }
}
