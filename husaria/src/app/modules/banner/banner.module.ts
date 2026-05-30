import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TranslocoModule } from '@jsverse/transloco';

import { BannerRoutingModule } from './banner-routing.module';
import { BannerDialogComponent } from './components/banner-dialog/banner-dialog.component';
import { BannerListComponent } from './components/banner-list/banner-list.component';

@NgModule({
  declarations: [
    BannerDialogComponent,
    BannerListComponent
  ],
  imports: [
    CommonModule,
    BannerRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ConfirmPopupModule,
    InputTextModule,
    TranslocoModule
  ],
  providers: [ConfirmationService]
})
export class BannerModule {}
