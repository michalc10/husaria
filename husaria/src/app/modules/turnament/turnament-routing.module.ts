import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TournamentLayoutComponent } from './tournament-layout/tournament-layout.component';
import { TournamentPlayersComponent } from './components/tournament-players/tournament-players.component';
import { ResultsComponent } from './components/results/results.component';
import { CompetitionComponent } from './components/competition/competition.component';
import { BattleTableComponent } from './components/battle-table/battle-table.component';
import { TournamentDefaultComponent } from './tournament-default/tournament-default.component';
import { JudgeStationsComponent } from './components/judge-stations/judge-stations.component';

const routes: Routes = [
  {
    path: ':idTournament',
    component: TournamentLayoutComponent,
    children: [
      { path: '', component: TournamentDefaultComponent, pathMatch: 'full' },
      { path: 'planning', redirectTo: 'planning/participants', pathMatch: 'full' },
      { path: 'planning/participants', component: TournamentPlayersComponent },
      { path: 'planning/competitions', component: CompetitionComponent },
      { path: 'live', component: TournamentDefaultComponent, pathMatch: 'full' },
      { path: 'live/stations', component: JudgeStationsComponent },
      { path: 'live/battle/:battleId', component: BattleTableComponent },
      { path: 'results', component: ResultsComponent },
      { path: 'participant', redirectTo: 'planning/participants', pathMatch: 'full' },
      { path: 'competition', redirectTo: 'planning/competitions', pathMatch: 'full' },
      { path: 'battle/:battleId', redirectTo: 'live/battle/:battleId', pathMatch: 'full' },
      { path: 'result', redirectTo: 'results', pathMatch: 'full' }
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TurnamentRoutingModule { }
