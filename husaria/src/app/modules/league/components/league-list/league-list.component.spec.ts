import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueListComponent } from './league-list.component';

describe('PlayerListComponent', () => {
  let component: LeagueListComponent;
  let fixture: ComponentFixture<LeagueListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeagueListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
