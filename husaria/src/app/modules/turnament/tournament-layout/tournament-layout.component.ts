import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../services/tournament/tournament.service';
import { ITournament } from 'src/app/models/tournament';

@Component({
  selector: 'app-tournament-layout',
  templateUrl: './tournament-layout.component.html',
  styleUrls: ['./tournament-layout.component.scss']
})
export class TournamentLayoutComponent implements OnInit {

  tournamentOption!: Number;

  tournament?: ITournament;

  tournamentOptions: any[] = [
    { name: 'Zawodnicy', value: 1 },
    { name: 'Szabla', value: 2 },
    { name: 'Pałasz', value: 3 },
    { name: 'Kopia', value: 4 },
    { name: 'Wyniki', value: 5 },
  ];


  constructor(
    private router: Router,
    private tournamentService: TournamentService) {

  }

  ngOnInit(): void {
    const val = localStorage.getItem("tournamentOption");
    const tournamentId = localStorage.getItem("tournamentId");
    if (tournamentId) {
      this.tournamentService.get(tournamentId).subscribe({
        next: (value) => {
          this.tournament = value;
          console.log(this.tournament)
        },
      })

    }
    if (val)
      this.tournamentOption = Number(val);
    else
      this.tournamentOption = 1;

  }

  selectedTournamentOptions(ev: any) {
    const val = ev.value
    const currentUrl = this.router.url;
    const urlFragments = currentUrl.split('/');
    if (val === 1)
      urlFragments[urlFragments.length - 1] = 'participant';
    else if (val === 2)
      urlFragments[urlFragments.length - 1] = 'sabre';
    else if (val === 3)
      urlFragments[urlFragments.length - 1] = 'broadsword';
    else if (val === 4)
      urlFragments[urlFragments.length - 1] = 'lance';

    localStorage.setItem("tournamentOption", val.toString())
    const newUrl = urlFragments.join('/');
    this.router.navigate([newUrl])
  }
}
