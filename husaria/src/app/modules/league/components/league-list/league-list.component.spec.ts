import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueListComponent } from './league-list.component';
import { LeagueModule } from '../../league.module';
import { TEST_IMPORTS, TEST_PROVIDERS } from 'src/app/testing/component-test-utils';

describe('PlayerListComponent', () => {
  let component: LeagueListComponent;
  let fixture: ComponentFixture<LeagueListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...TEST_IMPORTS, LeagueModule],
      providers: TEST_PROVIDERS,
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
