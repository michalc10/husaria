import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlayerRoutingModule } from './player-routing.module';
import { PlayerListComponent } from './components/player-list/player-list.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { PlayerDialogComponent } from './components/player-dialog/player-dialog.component';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';
@NgModule({
  declarations: [
    PlayerListComponent,
    PlayerDialogComponent
  ],
  imports: [
    CommonModule,
    PlayerRoutingModule,
    TableModule,
    ButtonModule,
    DialogModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmPopupModule
  ],
  providers: [ConfirmationService],
})
export class PlayerModule { }
