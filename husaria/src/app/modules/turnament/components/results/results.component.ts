import { Component, OnInit } from '@angular/core';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { PageOrientation } from 'pdfmake/interfaces';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

interface PlayersWithTotalScore {
  flag: string;
  totalScore: number;
  players: IPlayerPoints[];
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})

export class ResultsComponent implements OnInit {
  pdfTextSize = 15;
  selectedPlayerId = '-1';
  participantList: IPlayerPoints[] = [];
  tournamentId = "-1";
  orientationList: string[] = ['rosnąco', 'malejąco'];
  orientationPaper: string[] = ['poziomo', 'pionowo'];
  chosenOrientationList: string = this.orientationList[0];
  chosenOrientationPaper: string = this.orientationPaper[0];

  resultOptions: any[] = [
    { label: 'Indywidualne', valueResultOption: 'individualResults' }, 
    { label: 'Drużynowe', valueResultOption: 'teamResults' }
  ];
  valueResultOption: string = 'individualResults';

  teamResults: any[] = [];
  top3Players: PlayersWithTotalScore[] = [];

  constructor(
    private playerPointsService: PlayerPointsService
  ) { }

  ngOnInit() {
    this.tournamentId = localStorage.getItem('tournamentId')!;
    this.playerPointsService.getPlayerPointsForTournament(this.tournamentId).subscribe({
      next: (value: IPlayerPoints[]) => {
        this.participantList = value.map(tournament => ({
          ...tournament,
          score: this.calculateTotalScore(tournament) // Dynamic score calculation
        })).sort((a, b) => 
          this.chosenOrientationList === this.orientationList[0] ? a.score - b.score : b.score - a.score
        );
      }
    });
  }

  // Dynamic total score calculation based on the number of battles
  calculateTotalScore(player: IPlayerPoints): number {
    let totalScore = 0;
    for (let i = 1; i <= 5; i++) {
      if (player[`battle_${i}_score`]) {
        totalScore += player[`battle_${i}_score`];
      }
    }
    return +totalScore.toFixed(3);
  }

  exportPdf() {
    // Sort participants by score before building the table body
    const sortedParticipants = [...this.participantList].sort((a, b) => {
      // Apply the selected sorting (ascending or descending)
      return this.chosenOrientationList === this.orientationList[0]
        ? a.score - b.score // Ascending
        : b.score - a.score; // Descending
    });

    const tableBody = this.buildTableBody(sortedParticipants);
    const orientation = this.chosenOrientationPaper === this.orientationPaper[0] ? 'landscape' : 'portrait';

    const documentDefinition = this.valueResultOption === this.resultOptions[0].valueResultOption ? {
      pageOrientation: orientation as PageOrientation,
      content: [
        {
          table: {
            headerRows: 1,
            body: [
              [
                { text: '#', bold: true },
                { text: 'Husarz', bold: true },
                { text: 'Koń', bold: true },
                { text: 'Chorągiew', bold: true },
                { text: 'Wynik', bold: true }
              ],
              ...tableBody
            ]
          }
        }
      ],
      defaultStyle: {
        fontSize: this.pdfTextSize,
      }
    } : {
      pageOrientation: orientation as PageOrientation,
      content: [
        {
          table: {
            headerRows: 1,
            body: [
              [
                '',
                'Chorągiew',
                'Husarz',
                'Koń',
                'Punkty',
                'Suma'
              ],
              ...this.top3Players
                .sort((a, b) => this.chosenOrientationList === this.orientationList[0] ? a.totalScore - b.totalScore : b.totalScore - a.totalScore)
                .map((top3Players, rowIndex) => [
                  rowIndex + 1,
                  top3Players.flag,
                  top3Players.players.map(player => player.playerName).join('\n'),
                  top3Players.players.map(player => player.horse).join('\n'),
                  top3Players.players.map(player => player.score.toFixed(3)).join('\n'),
                  top3Players.totalScore.toFixed(3)
                ])
            ]
          }
        }
      ],
      defaultStyle: {
        fontSize: this.pdfTextSize,
      }
    };

    pdfMake.createPdf(documentDefinition).open();
}

  buildTableBody(data: IPlayerPoints[]) {
    const body: any[] = [];
    let i = 1;
    data.forEach(row => {
      body.push([i, row.playerName, row.horse, row.flag, row.score.toFixed(3)]);
      i++;
    });
    return body;
  }

  getTop3Players(): PlayersWithTotalScore[] {
    let top3ByFlag: Record<string, IPlayerPoints[]> = {};
    this.participantList.forEach(player => {
      if (!top3ByFlag[player.flag]) {
        top3ByFlag[player.flag] = [];
      }
      if (top3ByFlag[player.flag].length < 3) {
        top3ByFlag[player.flag].push(player);
      }
    });

    this.top3Players = [];
    for (const flag in top3ByFlag) {
      let totalScore = 0;
      let players: IPlayerPoints[] = [];
      if (top3ByFlag.hasOwnProperty(flag)) {
        for (const player of top3ByFlag[flag]) {
          players.push(player);
          totalScore += player.score;
        }
        this.top3Players.push({ players, totalScore, flag });
      }
    }
    return this.top3Players.sort((a, b) => a.totalScore - b.totalScore);
  }
}
