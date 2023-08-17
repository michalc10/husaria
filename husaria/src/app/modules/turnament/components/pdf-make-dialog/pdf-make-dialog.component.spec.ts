import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfMakeDialogComponent } from './pdf-make-dialog.component';

describe('PdfMakeDialogComponent', () => {
  let component: PdfMakeDialogComponent;
  let fixture: ComponentFixture<PdfMakeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdfMakeDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfMakeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
