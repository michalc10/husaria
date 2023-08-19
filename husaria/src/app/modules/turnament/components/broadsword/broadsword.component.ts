import { Component, OnInit } from '@angular/core';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import { Location } from '@angular/common';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { PageOrientation } from 'pdfmake/interfaces';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

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

  generatePDF() {
        const docDefinition = {
      pageOrientation: 'landscape' as PageOrientation,
      content: [
        { width: '*', text: '' },
        {
          style: 'table',
          width: 'auto',
          table: {
            headerRows: 3,
            body: [
              ['', '', 'P1', 'P2', '', 'P3 beczka', '', '', "P4 skok", '', 'P5', '', 'Punkty karne', '', '', ''],
              ['Start', 'Imię', 'Cięcie kapusty', 'Pchnięcie klocka\n0 | 1 | 2 | 3', 'Niższy chód', 'Ominięcie przeszkody', 'Demontaż przeszkody', 'Zrzutka', 'Ominięcie przeszkody', 'Demontaż przeszkody', 'Cięcie kapusty', 'Utrata broni', 'Upadek jeźdźca', 'Upadek konia i jeźdźca', 'Czas [s]', 'Wynik'],
              ['', '', ...this.points, '', ''],
              ...this.participantList.map((player, rowIndex) => {
                const saberPoints:string[] = [...player.broadswordPoints].map(point => { return point === '0' ? '' : 'X' })//'✔' : '✘'
                saberPoints[1] = player.broadswordPoints.charAt(1)
                return [
                  rowIndex + 1,
                  player.playerName,
                  ...saberPoints,
                  player.broadswordTime,
                  player.broadswordScore.toFixed(3)
                ]
              })
            ]
          },
        },
      ],
      styles: {
        // Define your styles here
        // table: { alignment:'center' },
        lineLeft: { fillColor: 'lightcyan', border: [true, true, false, true] },
        lineRight: { fillColor: 'lightcyan', border: [false, true, true, true] },
        lineBold: { fillColor: 'lightcyan', border: [true, true, true, true], lineWidth: 2 },
        // cell: { fillColor: 'lightcyan', alignment: 'center', fontSize: 10 },
        // anotherStyle: {   alignment: 'right', fontSize: 12 },
        // subHeader: { bold: true, alignment: 'center', fontSize: 10 },
        // centerText: { alignment: 'center', verticalAlignment: 'middle' },
        // Define other styles here,
        // anotherStyle: {
        //   italics: true,
        //   alignment: 'right'
        // }
      },
      defaultStyle: { fontSize: 10 },
    };


    pdfMake.createPdf(docDefinition).open();
  }

}
