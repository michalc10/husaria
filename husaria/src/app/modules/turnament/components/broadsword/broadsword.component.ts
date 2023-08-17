import { Component, OnInit } from '@angular/core';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import { Location } from '@angular/common';

@Component({
  selector: 'app-broadsword',
  templateUrl: './broadsword.component.html',
  styleUrls: ['./broadsword.component.scss']
})
export class BroadswordComponent implements OnInit {
  selectedPlayerId = '-1';
  points = [6, "10 | 0 | 6 | 8", 10, 25, 25, 5, 25, 25, 6, 5, 20, 40];
  participantList: IPlayerPoints[] = [];
  brickOptions: any[] = [
    { value: '0', name: 0, score: 10 },
    { value: '1', name: 1, score: 0 },
    { value: '2', name: 2, score: 6 },
    { value: '3', name: 3, score: 8 }
  ];

  constructor(
    private playerPointsService: PlayerPointsService
  ) { }
  tournamentId = "-1"

  ngOnInit() {
    this.tournamentId = localStorage.getItem('tournamentId')!;
    this.playerPointsService.getPlayerPointsForTournament(this.tournamentId).subscribe({
      next: (value: IPlayerPoints[]) => {
        this.participantList = value.sort((a, b) => b.sabreScore - a.sabreScore);
      },
    })
  }


  changedButton(player: IPlayerPoints, index: number, value: number) {

    const participantIndex = this.participantList.findIndex(participant => participant._id === player._id);

    const participant = this.participantList[participantIndex]
    const points = participant.broadswordPoints;
    participant.broadswordPoints = points.substring(0, index) + value + points.substring(index + 1);

    participant.broadswordScore += (value === 1 ? this.points[index] : -this.points[index]) as number;

    this.updatePlayerPoints(participant, participantIndex)
  }


  setTime(player: IPlayerPoints, ev: number) {
    const participantIndex = this.participantList.findIndex(participant => participant._id === player._id);
    const participant = this.participantList[participantIndex];
    participant.broadswordTime = ev;

    let score = 0;
    for (let i = 0; i < this.points.length; i++) {
      if (typeof this.points[i] === typeof 0)
        score += this.participantList[participantIndex].broadswordPoints.charAt(i) === '1' ? this.points[i] as number : 0;
      else
        score += this.brickOptions.find(op => op.value === this.participantList[participantIndex].broadswordPoints.charAt(i)).score
    }
    console.log(score, ev)
    participant.broadswordScore = score + ev;

    this.updatePlayerPoints(participant, participantIndex)
  }

  chosenRow(player: IPlayerPoints) {
    this.selectedPlayerId = player._id!;
  }

  setBrick(player: IPlayerPoints, event: any) {
    const participantIndex = this.participantList.findIndex(participant => participant._id === player._id);
    const participant = this.participantList[participantIndex];
    participant.broadswordScore -= this.brickOptions.find(op => op.value === participant.broadswordPoints.charAt(1)).score
    const points = participant.broadswordPoints;
    participant.broadswordPoints = points.substring(0, 1) + event.value + points.substring(2);
    participant.broadswordScore += this.brickOptions.find(op => op.value === participant.broadswordPoints.charAt(1)).score

    this.updatePlayerPoints(participant, participantIndex)
  }


  updatePlayerPoints(participant: IPlayerPoints, participantIndex: number) {
    this.playerPointsService.update(participant._id!, participant).subscribe({
      next: (value) => {
        this.participantList[participantIndex] = value;
      },
    })
  }

}
