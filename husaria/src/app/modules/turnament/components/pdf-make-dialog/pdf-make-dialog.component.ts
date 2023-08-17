import { Component, Input, Output, EventEmitter } from '@angular/core';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { PageOrientation } from 'pdfmake/interfaces';
pdfMake.vfs = pdfFonts.pdfMake.vfs;


@Component({
  selector: 'app-pdf-make-dialog',
  templateUrl: './pdf-make-dialog.component.html',
  styleUrls: ['./pdf-make-dialog.component.scss']
})
export class PdfMakeDialogComponent {

  @Input() show = false;
  @Output() close = new EventEmitter<boolean>();


  closeDialog(){
    this.close.emit(true)
  }

}
