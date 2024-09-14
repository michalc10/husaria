import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TournamentLayoutComponent } from './tournament-layout/tournament-layout.component';
import { TournamentPlayersComponent } from './components/tournament-players/tournament-players.component';
import { ResultsComponent } from './components/results/results.component';
import { CompetitionComponent } from './components/competition/competition.component';
import { BattleTableComponent } from './components/battle-table/battle-table.component';

const routes: Routes = [
  {
    path: ':idTournament',
    component: TournamentLayoutComponent,
    children: [
      { path: '', redirectTo: 'participant', pathMatch: 'full' },
      { path: 'battle/:battleId', component: BattleTableComponent },
      { path: 'participant', component: TournamentPlayersComponent },
      { path: 'result', component: ResultsComponent },
      { path: 'competition', component: CompetitionComponent }
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TurnamentRoutingModule { }
