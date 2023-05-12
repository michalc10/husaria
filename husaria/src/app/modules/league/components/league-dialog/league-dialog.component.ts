import { Component, Input, OnInit, Output, EventEmitter  } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ILeague } from 'src/app/models/league';
@Component({
  selector: 'app-league-dialog',
  templateUrl: './league-dialog.component.html',
  styleUrls: ['./league-dialog.component.scss']
})
export class LeagueDialogComponent implements OnInit {
  @Input() display: boolean = false;
  @Input() idLeague: String = "-1";
  @Output() comunication: EventEmitter<any> = new EventEmitter<any>();
  @Output() comunicationWithoutSaving: EventEmitter<Boolean> = new EventEmitter<Boolean>()

  leagueRout = 'league';
  leagueId?: String;
  league?: ILeague;
  leagueForm: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    year: ['', Validators.required]
  });;
  buttonText: String = 'Add';
  
  constructor(
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    if (this.leagueId!='-1') {
      this.buttonText = 'Zmień';
    } else {
      this.buttonText = 'Dodaj';
    }

    this.leagueForm
  }

  onSubmit() {
    const leagueData = this.leagueForm.value;

    const league: ILeague = {
      name: this.leagueForm.controls['name'].value,
      year: this.leagueForm.controls['year'].value
    }
   this.comunication.emit(league);
  }

  closingWithoutSaving() {
    this.comunicationWithoutSaving.emit(true);
  }
}
