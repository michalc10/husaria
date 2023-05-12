import { Component, Input, OnInit, Output, EventEmitter  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IPlayer } from 'src/app/models/player';
import { CrudService } from 'src/app/shered/service/crud.service';

@Component({
  selector: 'app-player-dialog',
  templateUrl: './player-dialog.component.html',
  styleUrls: ['./player-dialog.component.scss']
})
export class PlayerDialogComponent implements OnInit {
  @Input() display: boolean = false;
  @Input() idPlayer: String = "-1";
  @Output() comunication: EventEmitter<any> = new EventEmitter<any>();
  @Output() comunicationWithoutSaving: EventEmitter<Boolean> = new EventEmitter<Boolean>()

  playerRout = 'player';
  playerId?: String;
  player?: IPlayer;
  playerForm: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    horse: ['', Validators.required],
    flag: ['']
  });;
  buttonText: String = 'Add';
  
  constructor(
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    if (this.playerId!='-1') {
      this.buttonText = 'Zmień';
    } else {
      this.buttonText = 'Dodaj';
    }

    this.playerForm
  }

  onSubmit() {
    const playerData = this.playerForm.value;

    const player: IPlayer = {
      name: this.playerForm.controls['name'].value,
      horse: this.playerForm.controls['horse'].value,
      flag: this.playerForm.controls['flag'].value
    }
   this.comunication.emit(player);
  }

  closingWithoutSaving() {
    this.comunicationWithoutSaving.emit(true);
  }
}
