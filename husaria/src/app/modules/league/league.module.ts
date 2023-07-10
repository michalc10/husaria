import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LeagueRoutingModule } from './league-routing.module';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { LeagueListComponent } from './components/league-list/league-list.component';
import { LeagueDialogComponent } from './components/league-dialog/league-dialog.component';
import { ConfirmationService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';


@NgModule({
  declarations: [
    LeagueListComponent,
    LeagueDialogComponent
  ],
  imports: [
    CommonModule,
    LeagueRoutingModule,
    TableModule,
    ButtonModule,
    DialogModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmPopupModule,
    InputTextModule,
    CalendarModule
  ],
  providers: [ConfirmationService],
})
export class LeagueModule { }
