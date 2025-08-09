// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

const routes: Routes = [
  { path: '', redirectTo: 'league', pathMatch: 'full' },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'league',
        loadChildren: () => import('./modules/league/league.module').then(m => m.LeagueModule)
      },
      {
        path: 'tournament',
        loadChildren: () => import('./modules/turnament/turnament.module').then(m => m.TurnamentModule)
      },
      {
        path: 'shered',
        loadChildren: () => import('./shered/shered.module').then(m => m.SheredModule)
      },
      {
        path: 'player',
        loadChildren: () => import('./modules/player/player.module').then(m => m.PlayerModule)
      }
    ]
  },
  { path: '**', redirectTo: 'league' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}