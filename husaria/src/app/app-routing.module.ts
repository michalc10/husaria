import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'league',
    pathMatch: 'full'
  },
  {
    path: 'league',
    component: MainLayoutComponent,
    loadChildren: () => import('./modules/league/league.module').then(m => m.LeagueModule)
  },
  {
    path: 'tournament',
    component: MainLayoutComponent,
    loadChildren: () => import('./modules/turnament/turnament.module').then(m => m.TurnamentModule)
  },
  {
    path: 'shered',
    component: MainLayoutComponent,
    loadChildren: () => import('./shered/shered.module').then(m => m.SheredModule)
  },
  {
    path: 'player',
    component: MainLayoutComponent,
    loadChildren: () => import('./modules/player/player.module').then(m => m.PlayerModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
