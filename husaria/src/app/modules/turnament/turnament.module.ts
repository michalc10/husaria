import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TurnamentRoutingModule } from './turnament-routing.module';
import { SabreComponent } from './components/sabre/sabre.component';
import { BroadswordComponent } from './components/broadsword/broadsword.component';
import { LanceComponent } from './components/lance/lance.component';


@NgModule({
  declarations: [
    SabreComponent,
    BroadswordComponent,
    LanceComponent
  ],
  imports: [
    CommonModule,
    TurnamentRoutingModule
  ]
})
export class TurnamentModule { }
