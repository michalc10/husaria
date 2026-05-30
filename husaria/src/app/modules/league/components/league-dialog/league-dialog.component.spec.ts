import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueDialogComponent } from './league-dialog.component';
import { LeagueModule } from '../../league.module';
import { TEST_IMPORTS, TEST_PROVIDERS } from 'src/app/testing/component-test-utils';

describe('PlayerDialogComponent', () => {
  let component: LeagueDialogComponent;
  let fixture: ComponentFixture<LeagueDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...TEST_IMPORTS, LeagueModule],
      providers: TEST_PROVIDERS,
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
