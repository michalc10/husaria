import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pdf-make-dialog',
  templateUrl: './pdf-make-dialog.component.html',
  styleUrls: ['./pdf-make-dialog.component.scss'],
  standalone: false
})
export class PdfMakeDialogComponent {
  @Input() show = false;
  @Output() close = new EventEmitter<boolean>();

  closeDialog(): void {
    this.close.emit(true);
  }
}
