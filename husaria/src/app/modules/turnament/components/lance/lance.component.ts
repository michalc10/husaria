import { Component, OnInit } from '@angular/core';
import { PlayerPointsService } from '../../serices/playerPoints.service';
import { Location } from '@angular/common';
import { IPlayerPoints } from 'src/app/models/playerPoints';

@Component({
  selector: 'app-lance',
  templateUrl: './lance.component.html',
  styleUrls: ['./lance.component.scss']
})
export class LanceComponent implements OnInit {

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
    const points = participant.lancePoints;
    participant.lancePoints = points.substring(0, index) + value + points.substring(index + 1);

    participant.lanceScore += value === 1 ? this.points[index] : -this.points[index];

    this.playerPointsService.update(participant._id!, participant).subscribe({
      next: (value) => {
        this.participantList[participantIndex] = value;
      },
    })
  }


  setTime(player: IPlayerPoints, ev: number) {
    const participantIndex = this.participantList.findIndex(participant => participant._id === player._id);
    const participant = this.participantList[participantIndex];
    participant.lanceTime = ev;

    let score = 0;
    for (let i = 0; i < this.points.length; i++) {
      score += this.participantList[participantIndex].lancePoints.charAt(i) === '1' ? this.points[i] : 0;
    }

    participant.lanceScore = score + ev;

    this.playerPointsService.update(participant._id!, participant).subscribe({
      next: (value) => {
        this.participantList[participantIndex] = value;
      },
    })
  }

  chosenRow(player: IPlayerPoints) {
    this.selectedPlayerId = player._id!;
    console.log(this.selectedPlayerId)
  }
}
