import { Component, OnInit } from '@angular/core';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { style } from '@angular/animations';
import { PageOrientation } from 'pdfmake/interfaces';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

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
    const documentDefinition = {
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



  chechedSizeText(ev: any) {
    console.log("dsg", ev, ev.value)
  }
}