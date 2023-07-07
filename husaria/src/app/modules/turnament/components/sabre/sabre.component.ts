import { Component, OnInit } from '@angular/core';
import { PlayerPointsService } from '../../serices/playerPoints.service';
import { Location } from '@angular/common';
import { IPlayerPoints } from 'src/app/models/playerPoints';

@Component({
  selector: 'app-sabre',
  templateUrl: './sabre.component.html',
  styleUrls: ['./sabre.component.scss']
})
export class SabreComponent implements OnInit {

  points = [6, 6, 10, 25, 25, 5, 25, 25, 6, 5, 20, 40];
  participant: any;
  constructor(
    private playerPointsService: PlayerPointsService,
    private location: Location
  ) { }
  tournamentId = "-1"

  ngOnInit() {
    this.tournamentId = this.location.path().split('/')[2];
    this.playerPointsService.getPlayerPointsForTournament(this.tournamentId).subscribe({
      next: (value) => {
        console.log(value)
        this.participant = value;
      },
    })
  }


  changedButton(player:any,index:any){
    console.log(player,index);
  }
}
