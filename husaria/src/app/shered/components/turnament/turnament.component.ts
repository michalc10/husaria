import { Component } from '@angular/core';
import { CrudService } from '../../service/crud.service';
import { IPlayer } from 'src/app/models/player';
import { TranslocoService } from '@jsverse/transloco';

@Component({
    selector: 'app-turnament',
    templateUrl: './turnament.component.html',
    styleUrls: ['./turnament.component.scss'],
    standalone: false
})
export class TurnamentComponent {
  routPlayer = 'player';
  checkboxValues: any[20] = [];
  users = ['Użytkownik 1', 'Użytkownik 2', 'Użytkownik 3'];
  features = ['Funkcja 1', 'Funkcja 2', 'Funkcja 3'];

  playerList: IPlayer[] = [];

  constructor(
    private crudService: CrudService,
    private transloco: TranslocoService
  ) {
    
    this.crudService.list<IPlayer>(this.routPlayer).subscribe({
      next: (players) => (this.playerList = players),
      error: (err) => console.error(this.transloco.translate('player.loadError'), err)
    });
  }

  onCheckboxChange(event: any, user: string, feature: string) {
    const key = user + '_' + feature;
    // this.checkboxValues[key] = event.target.checked;
    console.log('Zmieniono pole wyboru', key, event.target.checked);
  }
}
