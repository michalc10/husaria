import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ILeague } from 'src/app/models/league';
import { ITournament } from 'src/app/models/tournament';
import { CrudService } from 'src/app/shered/service/crud.service';

@Component({
  selector: 'app-league-list',
  templateUrl: './league-list.component.html',
  styleUrls: ['./league-list.component.scss'],
})
export class LeagueListComponent implements OnInit {
  leagueRout = 'league';
  leagueList: ILeague[] = [];
  tournamentList: ITournament[] = [];
  chosenLeague!: ILeague;
  displayDialogCompnent = false;
  idchosenRaw: string = '-1';

  display = false;

  constructor(private router: Router, private crudService: CrudService) {
    this.chosenLeague = {
      _id: '-1',
      name: '',
      year: '',
    };
  }

  ngOnInit(): void {
    this.crudService.list<ILeague>('league').subscribe({
      next: (leagues) => {
        this.leagueList = leagues.sort(
          (a, b) => parseInt(b.year, 10) - parseInt(a.year, 10)
        );
      },
      error: (err) => console.error('Nie udało się pobrać lig', err),
    });
  }

  saveLeague(league: ILeague) {}

  createLeague() {
    const league: ILeague = {
      _id: '-1',
      name: '',
      year: '',
    };
    this.chosenLeague = league;
    this.displayDialogCompnent = true;
    this.display = true;
  }

  changeLeague(league: ILeague) {
    this.chosenLeague = league;
    this.displayDialogCompnent = true;
    this.display = true;
  }

  closedDialogWithoutSaving(bool: Boolean) {
    this.display = false;
  }

  returnFromChild(league: ILeague) {
    this.idchosenRaw = '-1';
    this.display = false;
    if (league._id !== '-1') {
      this.crudService.update(this.leagueRout, league._id!, league).subscribe({
        next: (value: ILeague) => {
          this.leagueList[
            this.leagueList.findIndex((le) => le._id === value._id)
          ] = value;
        },
      });
    } else {
      this.crudService.create(this.leagueRout, league).subscribe({
        next: (value: ILeague) => {
          this.leagueList.push(value);
        },
      });
    }
  }

  chosedRow(league: ILeague) {
    if (this.idchosenRaw !== league._id!) {
      this.idchosenRaw = league._id!;
      this.chosenLeague = league;
      this.crudService
        .read<ITournament[]>('tournament/league', league._id!)
        .subscribe({
          next: (tournaments) => {
            this.tournamentList = [...tournaments].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );
          },
          error: (err) => console.error(err),
        });
    } else {
      this.idchosenRaw = '-1';
    }
  }

  selectedTournament(tournament: ITournament) {
    localStorage.setItem('tournamentId', tournament._id!.toString());
    this.router.navigate(['tournament/' + tournament._id!.toString()]);
  }
}
