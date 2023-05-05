import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SheredRoutingModule } from './shered-routing.module';
import { SheredComponent } from './shered.component';
import { TurnamentComponent } from './components/turnament/turnament.component';


@NgModule({
  declarations: [
    SheredComponent,
    TurnamentComponent
  ],
  imports: [
    CommonModule,
    SheredRoutingModule
  ],
  exports:[TurnamentComponent]
})
export class SheredModule { }
