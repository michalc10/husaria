import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SabreComponent } from './components/sabre/sabre.component';
import { LanceComponent } from './components/lance/lance.component';
import { BroadswordComponent } from './components/broadsword/broadsword.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'sabre',
    pathMatch:'full'
  }, 
  {
    path: 'sabre',
    component: SabreComponent
  }, 
  {
    path: 'broadsword',
    component: BroadswordComponent
  }, 
  {
    path: 'lance',
    component: LanceComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TurnamentRoutingModule { }
