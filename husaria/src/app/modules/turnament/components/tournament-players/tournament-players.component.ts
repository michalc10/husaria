import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IPlayer } from 'src/app/models/player';
import { CrudService } from 'src/app/shered/service/crud.service';
import { Location } from '@angular/common';
@Component({
  selector: 'app-tournament-players',
  templateUrl: './tournament-players.component.html',
  styleUrls: ['./tournament-players.component.scss']
})
export class TournamentPlayersComponent implements OnInit {

  sourceProducts: IPlayer[] = [];

  targetProducts: IPlayer[] = [];
  leagueId = '0';

  constructor(
    private crudService: CrudService,
    private route: ActivatedRoute,
    private location: Location
  ) {
  }

  ngOnInit() {
  this.leagueId= this.location.path().split('/')[2]
    this.crudService.list('player').subscribe(
      {
        next: (value) => {
          this.sourceProducts = value
        },
      })
  }
  
  onMoveToTarget(event: any) {
    console.log(this.leagueId)
    console.log('Przeniesiono z source do target:', event.items);
    // Wykonaj operacje po przeniesieniu z source do target
  }

  onMoveToSource(event: any) {
    console.log('Przeniesiono z target do source:', event.items);
    // Wykonaj operacje po przeniesieniu z target do source
  }
  onMoveAllToTarget(event: any) {

    console.log('Przeniesiono z target do source:', event.items);
  }
  onMoveAllToSource(event: any) {

    console.log('Przeniesiono z target do source:', event.items);
  }
}
