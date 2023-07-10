import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ILeague } from 'src/app/models/league';
import { ITournament } from 'src/app/models/tournament';
import { TournamentService } from 'src/app/modules/turnament/services/tournament/tournament.service';
import { CrudService } from 'src/app/shered/service/crud.service';
@Component({
  selector: 'app-league-dialog',
  templateUrl: './league-dialog.component.html',
  styleUrls: ['./league-dialog.component.scss']
})
export class LeagueDialogComponent implements OnInit {


  newLeague!: ILeague;
  leagueForm: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    year: ['', Validators.required]
  });
  buttonText: String = 'Add';
  tournamentList: ITournament[] = []

  @Input() display: boolean = false;
  @Input() set league(league: ILeague) {
    this.newLeague = league;
    this.leagueForm.setValue({
      name: league.name,
      year: league.year
    });
    this.buttonText = league._id != '-1' ? 'Zmień' : 'Stwórz';
    if (league._id != '-1') {
      this.crudService.listById('tournament/league', league._id!)
      .subscribe({
        next: (value) => {
          this.tournamentList = value.map(tournament => {
            return { 
              ...tournament,
              date: new Date(tournament.date)
            }
          }).sort((a: ITournament, b: ITournament) => {
            return a.date.getTime() - b.date.getTime();
          });
        },
      })
    }
    else{
      this.tournamentList=[]
    }

  }


  @Output() comunication: EventEmitter<any> = new EventEmitter<any>();
  @Output() comunicationWithoutSaving: EventEmitter<Boolean> = new EventEmitter<Boolean>()



  constructor(
    private formBuilder: FormBuilder,
    private crudService: CrudService,
    private tournamentService:TournamentService
  ) { }

  ngOnInit() {

  }

  onSubmit() {
    const leagueData = this.leagueForm.value;

    this.newLeague.name = leagueData.name;
    this.newLeague.year = leagueData.year;

    this.tournamentList.forEach(tournament=>{
      this.tournamentService.update(tournament._id!,tournament).subscribe({
        next(value) {
          
        },error(err) {
          console.log("Cannot update tournament",err)
        },
      })
    })
    this.comunication.emit(this.newLeague);
  }

  closingWithoutSaving() {
    this.comunicationWithoutSaving.emit(true);
  }
 
}
