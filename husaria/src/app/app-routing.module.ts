// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { JudgeMobileComponent } from './modules/judge-mobile/judge-mobile.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { adminGuard, authChildGuard, authGuard } from './modules/auth/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'league', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'judge/:token', component: JudgeMobileComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
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
      },
      {
        path: 'banner',
        loadChildren: () => import('./modules/banner/banner.module').then(m => m.BannerModule)
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadChildren: () => import('./modules/users/users.module').then(m => m.UsersModule)
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
