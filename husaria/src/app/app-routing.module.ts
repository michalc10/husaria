import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'tournament',
    pathMatch: 'full'
  },
  {
    path: 'tournament',
    component: MainLayoutComponent,
    loadChildren: () => import('./modules/turnament/turnament.module').then(m => m.TurnamentModule)
  },
  {
    path: 'shered',
    component: MainLayoutComponent,
    loadChildren: () => import('./shared/shered/shered.module').then(m => m.SheredModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
