import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueListComponent } from './components/league-list/league-list.component';

const routes: Routes = [
  {path:'',redirectTo:'league-list',pathMatch:'full'},
  {
    path:'league-list',
    component:LeagueListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LeagueRoutingModule { }
