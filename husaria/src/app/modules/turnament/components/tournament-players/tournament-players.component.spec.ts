import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TournamentPlayersComponent } from './tournament-players.component';
import { TurnamentModule } from '../../turnament.module';
import { TEST_IMPORTS, TEST_PROVIDERS } from 'src/app/testing/component-test-utils';

describe('TournamentPlayersComponent', () => {
  let component: TournamentPlayersComponent;
  let fixture: ComponentFixture<TournamentPlayersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...TEST_IMPORTS, TurnamentModule],
      providers: TEST_PROVIDERS,
    })
    .compileComponents();

    fixture = TestBed.createComponent(TournamentPlayersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
