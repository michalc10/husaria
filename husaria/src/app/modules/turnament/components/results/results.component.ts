import { Component, OnInit } from '@angular/core';
import * as FileSaver from 'file-saver';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';

export interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

export interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})

export class ResultsComponent implements OnInit {


  selectedPlayerId = '-1';
  participantList: IPlayerPoints[] = [];
  tournamentId = "-1"
  exportColumns!: ExportColumn[];
  constructor(
    private playerPointsService: PlayerPointsService
  ) { }

  ngOnInit() {
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
    this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
  }

  exportPdf() {
    import('jspdf').then((jsPDF) => {
        import('jspdf-autotable').then((x) => {
            const doc = new jsPDF.default('p', 'px', 'a4');
            (doc as any).autoTable(this.exportColumns, this.participantList);
            doc.save('products.pdf');
        });
    });
}

exportExcel() {
    import('xlsx').then((xlsx) => {
        const worksheet = xlsx.utils.json_to_sheet(this.participantList);
        const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
        const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, 'products');
    });
}

saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    let EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
        type: EXCEL_TYPE
    });
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
}
}
