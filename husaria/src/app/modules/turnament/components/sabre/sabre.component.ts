import { Component, OnInit } from '@angular/core';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';
import { Location } from '@angular/common';
import { IPlayerPoints } from 'src/app/models/playerPoints';

@Component({
  selector: 'app-sabre',
  templateUrl: './sabre.component.html',
  styleUrls: ['./sabre.component.scss']
})
export class SabreComponent implements OnInit {

  selectedPlayerId='-1';
  points = [6, 6, 10, 25, 25, 5, 25, 25, 6, 5, 20, 40];
  participantList: IPlayerPoints[] = [];
  constructor(
    private playerPointsService: PlayerPointsService,
    private location: Location
  ) { }
  tournamentId = "-1"

  ngOnInit() {
    this.tournamentId = this.location.path().split('/')[2];
    this.playerPointsService.getPlayerPointsForTournament(this.tournamentId).subscribe({
      next: (value: IPlayerPoints[]) => {
        this.participantList = value;
      },
    })
  }


  changedButton(player: IPlayerPoints, index: number, value: number) {

    const participantIndex = this.participantList.findIndex(participant => participant._id === player._id);

    const participant = this.participantList[participantIndex]
    const points = participant.sabrePoints;
    participant.sabrePoints = points.substring(0, index) + value + points.substring(index + 1);

    participant.sabreScore += value === 1 ? this.points[index] : -this.points[index];

   
    this.updatePlayerPoints(participant, participantIndex)
  }


  setTime(player: IPlayerPoints, ev: number) {
    const participantIndex = this.participantList.findIndex(participant => participant._id === player._id);
    const participant = this.participantList[participantIndex];
    participant.sabreTime = ev;

    let score = 0;
    for (let i = 0; i < this.points.length; i++) {
      score += this.participantList[participantIndex].sabrePoints.charAt(i) === '1' ? this.points[i] : 0;
    }

    participant.sabreScore = score + ev;
   
    this.updatePlayerPoints(participant, participantIndex)
  }

  chosenRow(player: IPlayerPoints) {
    this.selectedPlayerId = player._id!;
    console.log(this.selectedPlayerId)
  }

  updatePlayerPoints(participant:IPlayerPoints,participantIndex:number){
    this.playerPointsService.update(participant._id!, participant).subscribe({
      next: (value) => {
        this.participantList[participantIndex] = value;
      },
    })
  }
}
