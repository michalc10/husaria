import { Component } from '@angular/core';
import { CrudService } from '../../service/crud.service';
import { IPlayer } from 'src/app/models/player';

@Component({
  selector: 'app-turnament',
  templateUrl: './turnament.component.html',
  styleUrls: ['./turnament.component.scss']
})
export class TurnamentComponent {

  routPlayer = 'player';
  checkboxValues: any[20] = []
  users = ['User 1', 'User 2', 'User 3'];
  features = ['Feature 1', 'Feature 2', 'Feature 3'];

  playerList: IPlayer[] = [];

  constructor(
    private crudService: CrudService
  ) {
    this.crudService.list(this.routPlayer)
      .subscribe({
        next: (value) => {
          this.playerList = value;
        },error(err) {
          console.log(err)
        },
      })
  }

  onCheckboxChange(event: any, user: string, feature: string) {
    const key = user + '_' + feature;
    // this.checkboxValues[key] = event.target.checked;
    console.log('Checkbox value changed for', key, 'to', event.target.checked);
  }
}
