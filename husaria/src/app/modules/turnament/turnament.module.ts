import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TurnamentRoutingModule } from './turnament-routing.module';
import { SabreComponent } from './components/sabre/sabre.component';
import { BroadswordComponent } from './components/broadsword/broadsword.component';
import { LanceComponent } from './components/lance/lance.component';
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
import { DropdownModule } from 'primeng/dropdown';
import { PdfMakeDialogComponent } from './components/pdf-make-dialog/pdf-make-dialog.component';
import { DialogModule } from 'primeng/dialog';

@NgModule({
  declarations: [
    SabreComponent,
    BroadswordComponent,
    LanceComponent,
    TournamentPlayersComponent,
    TournamentLayoutComponent,
    ResultsComponent,
    PdfMakeDialogComponent,
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
    DropdownModule,
    DialogModule
  ]
})
export class TurnamentModule { }
