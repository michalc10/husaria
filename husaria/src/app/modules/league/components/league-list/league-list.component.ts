import { Component, OnInit } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ILeague } from 'src/app/models/league';
import { ITournament } from 'src/app/models/tournament'
import { CrudService } from 'src/app/shered/service/crud.service';

@Component({
  selector: 'app-league-list',
  templateUrl: './league-list.component.html',
  styleUrls: ['./league-list.component.scss']
})
export class LeagueListComponent implements OnInit {

  leagueRout = 'league';
  leagueList: ILeague[] = [];
  tournamentList: ITournament[] = [];
  idLeague: String = '-1';
  displayDialogCompnent = false;
  idchosenRaw: string = '-1'

  display = false;

  constructor(
    private crudService: CrudService,
    private confirmationService: ConfirmationService
  ) {

  }

  ngOnInit(): void {
    this.crudService.list('league')
      .subscribe({
        next: (value) => {
          this.leagueList = value;
        },
      })
    
  }


  saveLeague(league: ILeague) {

  }

  createLeague() {
    this.idLeague = '-1';
    this.displayDialogCompnent = true;
    this.display = true;

  }

  changeLeague(id: String) {
    this.idLeague = id;
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
    const league = event as ILeague
    if (this.idLeague != '-1') {
      this.crudService.update(this.leagueRout, league._id!, league).subscribe({
        next: (value: ILeague) => {
          this.leagueList.push(value)

        },
      }
      );
    } else {
      this.crudService.create(this.leagueRout, league).subscribe({
        next: (value: ILeague) => {
          this.leagueList.push(value)

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
        this.crudService.delete(this.leagueRout, id).subscribe(
          {
            next: (value) => {
              this.leagueList = [...this.leagueList.filter((league: ILeague) => { return league._id != id })]

            },
          }
        )
      },
      reject: () => {
      }
    });
  }


  chosedRow(league: ILeague) {
    if (this.idchosenRaw !== league._id!) {
      this.idchosenRaw = league._id!;
      this.crudService.listById('tournament/league', league._id!)
      .subscribe({
        next: (value) => {
          this.tournamentList = value;
        },
      })
    } else {
      this.idchosenRaw = '-1';
    }
  }
}
