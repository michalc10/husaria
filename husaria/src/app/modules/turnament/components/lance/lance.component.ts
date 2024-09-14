import { Component, OnInit } from '@angular/core';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { PageOrientation } from 'pdfmake/interfaces';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

interface IPlayerPoints {
  _id?: string,
  tournamentId: string;
  playerName: string,
  horse: string,
  flag: string,
  playerId: string,

  sabrePoints: string,
  sabreExtraPoints: number,
  sabreTime: number,
  sabreScore: number,

  broadswordPoints: string,
  broadswordExtraPoints: number,
  broadswordTime: number,
  broadswordScore: number,

  lancePoints: string,
  lanceExtraPoints: number,
  lanceTime: number,
  lanceScore: number,

  penalty: number,
  score: number

}

@Component({
  selector: 'app-lance',
  templateUrl: './lance.component.html',
  styleUrls: ['./lance.component.scss']
})
export class LanceComponent implements OnInit {

  selectedPlayerId = '-1';
  points = [6, 6, 10, 25, 25, 5, 25, 25, 6, 5, 20, 40,''];
  participantList: IPlayerPoints[] = [];
  constructor(
    private playerPointsService: PlayerPointsService
  ) { }
  tournamentId = "-1"

  ngOnInit() {
    this.tournamentId = localStorage.getItem('tournamentId')!;
    this.playerPointsService.getPlayerPointsForTournament(this.tournamentId).subscribe({
      next: (value: IPlayerPoints[]) => {
        this.participantList = value.sort((a, b) => b.sabreScore + b.broadswordScore - a.sabreScore - a.broadswordScore);
      },
      error(err) {
        console.log("err", err)
      },
    })
  }


  changedButton(player: IPlayerPoints, index: number, value: number) {

    const participantIndex = this.participantList.findIndex(participant => participant._id === player._id);

    const participant = this.participantList[participantIndex]
    const lancePoints = participant.lancePoints;
    participant.lancePoints = lancePoints.substring(0, index) + value + lancePoints.substring(index + 1);

    const points = this.points[index] as number
    participant.lanceScore += value === 1 ? points : -points;

    this.updatePlayerPoints(participant, participantIndex)
  }


  setTime(player: IPlayerPoints, lanceTime: number) {
    const participantIndex = this.participantList.findIndex(participant => participant._id === player._id);
    const participant = this.participantList[participantIndex];
    participant.lanceTime = lanceTime;

    let score = 0;
    for (let i = 0; i < this.points.length; i++) {
      score += this.participantList[participantIndex].lancePoints.charAt(i) === '1' ? this.points[i] as number : 0;
    }

    participant.lanceScore = score + lanceTime + participant.lanceExtraPoints;
    this.updatePlayerPoints(participant, participantIndex);

  }

  setExtraPoints(id: number, extraPoints: number) {
    const participantIndex = this.participantList.findIndex(participant => participant._id === id.toString());
    const participant = this.participantList[participantIndex];
    participant.lanceExtraPoints = extraPoints;

    let score = 0;
    for (let i = 0; i < this.points.length; i++) {
      score += this.participantList[participantIndex].lancePoints.charAt(i) === '1' ? this.points[i] as number : 0;
    }

    participant.lanceScore = score + extraPoints + this.participantList[participantIndex].lanceTime;
    this.updatePlayerPoints(participant, participantIndex);

  }


  updatePlayerPoints(participant: IPlayerPoints, participantIndex: number) {
    this.playerPointsService.update(participant._id!, participant).subscribe({
      next: (value) => {
        this.participantList[participantIndex] = value;
      },
    })
  }


  chosenRow(player: IPlayerPoints) {
    this.selectedPlayerId = player._id!;
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
              ['Start', 'Imię', 'Pierścień 1', 'Pierścień 2', 'Niższy chód', 'Ominięcie przeszkody', 'Demontaż przeszkody', 'Zrzutka', 'Ominięcie przeszkody', 'Demontaż przeszkody', 'Pierścień 3', 'Utrata broni', 'Upadek jeźdźca', 'Upadek konia i jeźdźca', 'Czas [s]', 'Wynik'],
              ['', '', ...this.points, '', ''],
              ...this.participantList.map((player, rowIndex) => {
                const saberPoints = [...player.lancePoints].map(point => { return point === '0' ? '' : 'X' })//'✔' : '✘'
                return [
                  rowIndex + 1,
                  player.playerName,
                  ...saberPoints,
                  player.lanceTime,
                  player.lanceScore.toFixed(3)
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
