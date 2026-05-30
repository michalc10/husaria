import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfMakeDialogComponent } from './pdf-make-dialog.component';
import { TurnamentModule } from '../../turnament.module';
import { TEST_IMPORTS, TEST_PROVIDERS } from 'src/app/testing/component-test-utils';

describe('PdfMakeDialogComponent', () => {
  let component: PdfMakeDialogComponent;
  let fixture: ComponentFixture<PdfMakeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...TEST_IMPORTS, TurnamentModule],
      providers: TEST_PROVIDERS,
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
