import { Component, OnInit } from '@angular/core';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';
import { Location } from '@angular/common';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { PageOrientation } from 'pdfmake/interfaces';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-sabre',
  templateUrl: './sabre.component.html',
  styleUrls: ['./sabre.component.scss']
})
export class SabreComponent implements OnInit {

  selectedPlayerId = '-1';
  points = [6, 6, 10, 25, 25, 5, 25, 25, 6, 5, 20, 40];
  participantList: IPlayerPoints[] = [];
  tournamentId = "-1"

  isOpenedPdfMakeDialog = false;

  constructor(
    private playerPointsService: PlayerPointsService,
    private location: Location
  ) { }

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

  updatePlayerPoints(participant: IPlayerPoints, participantIndex: number) {
    this.playerPointsService.update(participant._id!, participant).subscribe({
      next: (value) => {
        this.participantList[participantIndex] = value;
      },
    })
  }

  closePdfMekeDialog(ev: any) {
    this.isOpenedPdfMakeDialog = false;
  }



  generatePDF() {
    const tableBody = this.participantList.map(player => {
      const row = [
        { text: player.playerName, style: ['line-left', 'line-right', 'center-text'] },
        // ... Map other cell values here
      ];

      for (const point of this.points) {
        row.push({
          text: player.sabrePoints.charAt(point) === '0' ? '✔' : '✘',
          style: ['line-left', 'line-right', 'center-text']
        });
      }

      row.push(
        { text: player.sabreTime.toFixed(2), style: ['line-left', 'line-right', 'center-text'] },
        { text: player.sabreScore.toFixed(3), style: ['line-left', 'line-right', 'center-text'] }
      );

      return row;
    });



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
              ['Start', 'Imię', 'Cięcie łozy', 'Cięcie jabłka', 'Niższy chód', 'Ominięcie przeszkody', 'Demontaż przeszkody', 'Zrzutka', 'Ominięcie przeszkody', 'Demontaż przeszkody', 'Cięcie jabłka', 'Utrata broni', 'Upadek jeźdźca', 'Upadek konia i jeźdźca', 'Czas [s]', 'Wynik'],
              ['', '', ...this.points, '', ''],
              ...this.participantList.map((player, rowIndex) => {
                const saberPoints = [...player.sabrePoints].map(point => { return point === '0' ? '' : 'X' })//'✔' : '✘'
                return [
                  rowIndex + 1,
                  player.playerName,
                  ...saberPoints,
                  player.sabreTime,
                  player.sabreScore
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

    // docDefinition.content[0].table.body.push(...tableBody);

    pdfMake.createPdf(docDefinition).open();
  }




}
