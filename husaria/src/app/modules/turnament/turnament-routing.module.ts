import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SabreComponent } from './components/sabre/sabre.component';
import { LanceComponent } from './components/lance/lance.component';
import { BroadswordComponent } from './components/broadsword/broadsword.component';
import { TournamentLayoutComponent } from './tournament-layout/tournament-layout.component';
import { TournamentPlayersComponent } from './components/tournament-players/tournament-players.component';
import { ResultsComponent } from './components/results/results.component';

const routes: Routes = [
  {path:':idTournament',redirectTo:':idTournament/participant',pathMatch:'full'},
  {
    path: ':idTournament',
    component: TournamentLayoutComponent,
    children: [

      {
        path: 'sabre',
        component: SabreComponent
      },
      {
        path: 'broadsword',
        component: BroadswordComponent
      },
      {
        path: 'lance',
        component: LanceComponent
      },
      {
        path: 'participant',
        component: TournamentPlayersComponent
      },
      {
        path: 'result',
        component: ResultsComponent
      }

    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TurnamentRoutingModule { }
