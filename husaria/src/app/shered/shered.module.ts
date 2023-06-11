import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SheredRoutingModule } from './shered-routing.module';
import { SheredComponent } from './shered.component';
import { TurnamentComponent } from './components/turnament/turnament.component';

import { FormsModule } from '@angular/forms';
import { CrudService } from './service/crud.service';

@NgModule({
  declarations: [
    SheredComponent,
    TurnamentComponent
  ],
  imports: [
    CommonModule,
    SheredRoutingModule,
    FormsModule
  ],
  exports:[TurnamentComponent]
})
export class SheredModule { }
