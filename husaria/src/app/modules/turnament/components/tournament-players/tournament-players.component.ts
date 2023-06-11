import { Component, OnInit } from '@angular/core';
import { IPlayer } from 'src/app/models/player';
import { CrudService } from 'src/app/shered/service/crud.service';

@Component({
  selector: 'app-tournament-players',
  templateUrl: './tournament-players.component.html',
  styleUrls: ['./tournament-players.component.scss']
})
export class TournamentPlayersComponent implements OnInit {

  sourceProducts: IPlayer[] = [];

  targetProducts: IPlayer[] = [];

  constructor(
    private crudService: CrudService
  ) {
  }

  ngOnInit() {

    this.crudService.list('player').subscribe(
      {
        next: (value) => {
          this.sourceProducts = value
        },
      })
  }
  onMoveToTarget(event:any) {
    console.log('Przeniesiono z source do target:', event.items);
    // Wykonaj operacje po przeniesieniu z source do target
  }
  
  onMoveToSource(event:any) {
    console.log('Przeniesiono z target do source:', event.items);
    // Wykonaj operacje po przeniesieniu z target do source
  }
  onMoveAllToTarget(event:any){

    console.log('Przeniesiono z target do source:', event.items);
  }
  onMoveAllToSource(event:any){

    console.log('Przeniesiono z target do source:', event.items);
  }
}
