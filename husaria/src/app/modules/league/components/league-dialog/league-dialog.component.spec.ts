import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueDialogComponent } from './league-dialog.component';

describe('PlayerDialogComponent', () => {
  let component: LeagueDialogComponent;
  let fixture: ComponentFixture<LeagueDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeagueDialogComponent ]
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
