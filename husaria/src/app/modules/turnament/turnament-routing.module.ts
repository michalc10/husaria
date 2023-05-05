import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SabreComponent } from './components/sabre/sabre.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'sabre',
    pathMatch:'full'
  }, 
  {
    path: 'sabre',
    component: SabreComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TurnamentRoutingModule { }
