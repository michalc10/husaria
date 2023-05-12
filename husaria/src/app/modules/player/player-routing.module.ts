import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayerListComponent } from './components/player-list/player-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'player-list', pathMatch: 'full' },
  { path: 'player-list', component: PlayerListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlayerRoutingModule { }
