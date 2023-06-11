import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tournament-layout',
  templateUrl: './tournament-layout.component.html',
  styleUrls: ['./tournament-layout.component.scss']
})
export class TournamentLayoutComponent {


  value: number = 1;

  tournamentOptions: any[] = [
    { name: 'Zawodnicy', value: 1 },
    { name: 'Szabla', value: 2 },
    { name: 'Pałasz', value: 3 },
    { name: 'Kopia', value: 4 },
    { name: 'Wyniki', value: 5 },
  ];

  constructor(private router: Router) { }

  selectedTournamentOptions(val: number) {
    const currentUrl = this.router.url; // Get the current URL
    const urlFragments = currentUrl.split('/'); // Split the URL into fragments
    const lastFragment = urlFragments[urlFragments.length - 1];
    if (val === 1 && lastFragment !== 'participant')
      urlFragments[urlFragments.length - 1] = 'participant';
    else if (val === 2 && lastFragment !== 'sabre')
      urlFragments[urlFragments.length - 1] = 'sabre';
    else if (val === 3 && lastFragment !== 'broadsword')
      urlFragments[urlFragments.length - 1] = 'broadsword';
    else if (val === 4 && lastFragment !== 'lance')
      urlFragments[urlFragments.length - 1] = 'lance';
    // else if (val === 5 && lastFragment !== 'saber')
    //   urlFragments[urlFragments.length - 1] = 'saber';

    const newUrl = urlFragments.join('/');
    this.router.navigate([newUrl])
  }
}
