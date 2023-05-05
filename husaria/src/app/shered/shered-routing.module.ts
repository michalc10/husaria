import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SheredComponent } from './shered.component';

const routes: Routes = [{ path: '', component: SheredComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SheredRoutingModule { }
