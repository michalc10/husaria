import { Component, OnInit } from '@angular/core';
import { IPlayer } from 'src/app/models/player';
import { CrudService } from 'src/app/shered/service/crud.service';
import { Location } from '@angular/common';
import { PlayerPointsService } from '../../serices/playerPoints.service';
import { IPlayerPoints } from 'src/app/models/playerPoints';
@Component({
  selector: 'app-tournament-players',
  templateUrl: './tournament-players.component.html',
  styleUrls: ['./tournament-players.component.scss']
})
export class TournamentPlayersComponent implements OnInit {

  sourceProducts: IPlayer[] = [];

  targetProducts: IPlayer[] = [];

  tournamentId = '0';

  constructor(
    private crudService: CrudService,
    private playerPointsService: PlayerPointsService,
    private location: Location
  ) {
  }

  ngOnInit() {
    this.tournamentId = this.location.path().split('/')[2];
    this.playerPointsService.getPlayerPointsForTournament(this.tournamentId).subscribe(
      {
        next: (playerPointsList: IPlayerPoints[]) => {

          playerPointsList.forEach(playerPoints => {
            const player: IPlayer = {
              name: playerPoints.playerName,
              flag: playerPoints.flag,
              horse: playerPoints.horse,
              _id: playerPoints.playerId
            }
            this.targetProducts.push(player);
          })
          this.crudService.list('player').subscribe(
            {
              next: (playerList: IPlayer[]) => {
                playerList.forEach(player => {
                  if (!this.targetProducts.find(el => el._id === player._id)) {
                    this.sourceProducts.push(player)
                  }
                })
                this.sourceProducts = [...this.sourceProducts]
              },
            })
        },
        error(err) {
          console.log(err);
        },
      }
    )

  }

  onMoveToTarget(event: any) {
    const player = event.items[0] as IPlayer;
    this.playerPointsService.create(
      {
        tournamentId: this.tournamentId,
        playerName: player.name,
        horse: player.horse,
        flag: player.flag,
        playerId: player._id
      }).subscribe({
        next(value) {
          
        },error(err) {
          console.log(err)
        },
      })
  }

  onMoveToSource(event: any) {
    const player = event.items[0] as IPlayer;
    this.playerPointsService.getPlayerPointsForTournament(this.tournamentId).subscribe({
      next:(playerPointsList) =>{
        playerPointsList.map(playerPoints=>{
          if(playerPoints.playerId===player._id){
            this.playerPointsService.delete(playerPoints._id!).subscribe()
          }
        })
      },
    })
  }
  onMoveAllToTarget(event: any) {

    console.log('Przeniesiono z target do source:', event.items);
  }
  onMoveAllToSource(event: any) {

    console.log('Przeniesiono z target do source:', event.items);
  }
}
