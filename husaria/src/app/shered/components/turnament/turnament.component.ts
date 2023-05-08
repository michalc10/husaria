import { Component } from '@angular/core';

@Component({
  selector: 'app-turnament',
  templateUrl: './turnament.component.html',
  styleUrls: ['./turnament.component.scss']
})
export class TurnamentComponent {
  checkboxValues:any[20]=[]
  users = ['User 1', 'User 2', 'User 3'];
  features = ['Feature 1', 'Feature 2', 'Feature 3'];
  // checkboxValues = {};

  onCheckboxChange(event:any, user:string, feature:string) {
    const key = user + '_' + feature;
    // this.checkboxValues[key] = event.target.checked;
    console.log('Checkbox value changed for', key, 'to', event.target.checked);
  }
}
