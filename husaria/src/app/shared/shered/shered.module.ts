import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SheredRoutingModule } from './shered-routing.module';
import { SheredComponent } from './shered.component';


@NgModule({
  declarations: [
    SheredComponent
  ],
  imports: [
    CommonModule,
    SheredRoutingModule
  ]
})
export class SheredModule { }
