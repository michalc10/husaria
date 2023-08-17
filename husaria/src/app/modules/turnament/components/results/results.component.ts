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
  orientationList: string[] = ['poziomo', 'pionowo']
  chosenOrientation: string = this.orientationList[0]


  resultOptions: any[] = [{ label: 'Indywidualne', valueResultOption: 'individualResults' }, { label: 'Drużynowe', valueResultOption: 'teamResults' }];
  valueResultOption: string = 'individualResults';


  teamResults: any[] = [];
  top3Players: PlayersWithTotalScore[] = [];

  constructor(
    private playerPointsService: PlayerPointsService
  ) { }

  ngOnInit() {
    this.orientationList = ['poziomo', 'pionowo']
    this.chosenOrientation = this.orientationList[0]
    this.tournamentId = localStorage.getItem('tournamentId')!;
    this.playerPointsService.getPlayerPointsForTournament(this.tournamentId).subscribe({
      next: (value: IPlayerPoints[]) => {
        this.participantList = value.map(tournament => {
          return {
            ...tournament,
            score: tournament.lanceScore + tournament.broadswordScore + tournament.sabreScore
          }
        }).sort((a, b) => { return a.score - b.score });
        // this.participantList.sort((a, b) => a.flag.localeCompare(b.flag) || a.score - b.score);

      },
    })
    // this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  exportPdf() {
    // import('jspdf').then((jsPDF) => {
    //   import('jspdf-autotable').then((x) => {
    //     const doc = new jsPDF.default('p', 'px', 'a4');
    //     (doc as any).autoTable(this.exportColumns, this.participantList);
    //     doc.save('products.pdf');
    //   });
    // });
    const tableBody = this.buildTableBody(this.participantList);
    const orientation = this.chosenOrientation === this.orientationList[0] ? 'landscape' : 'portrait'

    // console.log(this.valueResultOption, this.resultOptions[0].value)
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
        // fontSize:15,
        // bold: true
      }
    } :
      {
        pageOrientation: orientation as PageOrientation,
        content: [
          {
            table: {
              headerRows: 1,
              // widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
              body: [
                [
                  '',
                  'Chorągiew',
                  'Husarz',
                  'Koń',
                  'Punkty',
                  'Suma'
                ],
                ...this.top3Players.map((top3Players, rowIndex) => [
                  rowIndex + 1,
                  top3Players.flag,
                  top3Players.players.map(player => player.playerName).join('\n'),
                  top3Players.players.map(player => player.horse).join('\n'),
                  top3Players.players.map(player => player.score).join('\n'),
                  top3Players.totalScore
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

  // exportExcel() {
  //     import('xlsx').then((xlsx) => {
  //         const worksheet = xlsx.utils.json_to_sheet(this.participantList);
  //         const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
  //         const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
  //         this.saveAsExcelFile(excelBuffer, 'products');
  //     });
  // }

  // saveAsExcelFile(buffer: any, fileName: string): void {
  //     let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  //     let EXCEL_EXTENSION = '.xlsx';
  //     const data: Blob = new Blob([buffer], {
  //         type: EXCEL_TYPE
  //     });
  //     FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  // }



  buildTableBody(data: IPlayerPoints[]) {
    const body: any[] = [];

    let i = 1
    data.forEach(row => {
      body.push([i, row.playerName, row.horse, row.flag, row.score]);
      i++;
    });

    return body;
  }




  getTop3Players(): PlayersWithTotalScore[] {

    let top3ByFlag: Record<string, IPlayerPoints[]> = {};

    this.participantList.sort((a, b) => { return a.score - b.score }).forEach(player => {
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
        for (const playerKey in top3ByFlag[flag]) {
          const player = top3ByFlag[flag][playerKey];
          players.push(player)
          totalScore += player.score;
        }
        this.top3Players.push({ players: players, totalScore: totalScore, flag: top3ByFlag[flag][0].flag });
      }
    }
    return this.top3Players.sort((a, b) => a.totalScore - b.totalScore);
  }
}