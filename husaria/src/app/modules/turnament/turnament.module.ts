import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TurnamentRoutingModule } from './turnament-routing.module';
import { SheredModule } from 'src/app/shered/shered.module';
import { TournamentPlayersComponent } from './components/tournament-players/tournament-players.component';
import { TournamentLayoutComponent } from './tournament-layout/tournament-layout.component';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { PickListModule } from 'primeng/picklist';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { ResultsComponent } from './components/results/results.component';
import { SelectModule } from 'primeng/select';
import { PdfMakeDialogComponent } from './components/pdf-make-dialog/pdf-make-dialog.component';
import { DialogModule } from 'primeng/dialog';
import { CompetitionComponent } from './components/competition/competition.component';
import { BattleTableComponent } from './components/battle-table/battle-table.component';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslocoModule } from '@jsverse/transloco';
import { TooltipModule } from 'primeng/tooltip';
import { TournamentDefaultComponent } from './tournament-default/tournament-default.component';
import { JudgeStationsComponent } from './components/judge-stations/judge-stations.component';

@NgModule({
  declarations: [
    TournamentPlayersComponent,
    TournamentLayoutComponent,
    ResultsComponent,
    PdfMakeDialogComponent,
    CompetitionComponent,
    BattleTableComponent,
    TournamentDefaultComponent,
    JudgeStationsComponent,
  ],
  imports: [
    CommonModule,
    TurnamentRoutingModule,
    SheredModule,
    FormsModule,
    ButtonModule,
    SelectButtonModule,
    PickListModule,
    TableModule,
    InputNumberModule,
    SelectModule,
    DialogModule,
    SkeletonModule,
    TranslocoModule,
    TooltipModule
  ]
})
export class TurnamentModule { }
