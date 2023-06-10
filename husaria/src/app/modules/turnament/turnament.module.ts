import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TurnamentRoutingModule } from './turnament-routing.module';
import { SabreComponent } from './components/sabre/sabre.component';
import { BroadswordComponent } from './components/broadsword/broadsword.component';
import { LanceComponent } from './components/lance/lance.component';
import { SheredComponent } from 'src/app/shered/shered.component';
import { SheredModule } from 'src/app/shered/shered.module';
import { TournamentPlayersComponent } from './components/tournament-players/tournament-players.component';
import { TournamentLayoutComponent } from './tournament-layout/tournament-layout.component';


@NgModule({
  declarations: [
    SabreComponent,
    BroadswordComponent,
    LanceComponent,
    TournamentPlayersComponent,
    TournamentLayoutComponent
  ],
  imports: [
    CommonModule,
    TurnamentRoutingModule,
    SheredModule
  ]
})
export class TurnamentModule { }
