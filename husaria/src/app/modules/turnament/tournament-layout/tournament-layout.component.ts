import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TournamentService } from '../services/tournament/tournament.service';
import { ITournament } from 'src/app/models/tournament';

@Component({
  selector: 'app-tournament-layout',
  templateUrl: './tournament-layout.component.html',
  styleUrls: ['./tournament-layout.component.scss']
})
export class TournamentLayoutComponent implements OnInit {
  tournamentOption!: number;
  tournament?: ITournament;

  tournamentOptions: any[] = [
    { name: 'Zawodnicy', value: 1 },
    { name: 'Konkurencje', value: 2 }
  ];

  constructor(
    private router: Router, 
    private route: ActivatedRoute, 
    private tournamentService: TournamentService
  ) { }

  ngOnInit(): void {
    const tournamentId = localStorage.getItem('tournamentId');
    if (tournamentId) {
      this.tournamentService.get(tournamentId).subscribe((tournament) => {
        this.tournament = tournament;
        this.loadBattleNames();
        this.syncRouteWithOption();  // Sync the option with the current route
      });
    }

    const val = localStorage.getItem("tournamentOption");
    this.tournamentOption = val ? Number(val) : 1;

    // Listen for route changes to keep selectButton updated
    this.route.params.subscribe(params => {
      this.syncRouteWithOption();
    });
  }

  // Load dynamic battle names
  loadBattleNames() {
    if (this.tournament?.battle_1) {
      const battle1Name = this.getBattleName(this.tournament.battle_1);
      this.tournamentOptions.push({ name: `1. ${battle1Name}`, value: 3 });
    }
    if (this.tournament?.battle_2) {
      const battle2Name = this.getBattleName(this.tournament.battle_2);
      this.tournamentOptions.push({ name: `2. ${battle2Name}`, value: 4 });
    }
    if (this.tournament?.battle_3) {
      const battle3Name = this.getBattleName(this.tournament.battle_3);
      this.tournamentOptions.push({ name: `3. ${battle3Name}`, value: 5 });
    }
    if (this.tournament?.battle_4) {
      const battle4Name = this.getBattleName(this.tournament.battle_4);
      this.tournamentOptions.push({ name: `4. ${battle4Name}`, value: 6 });
    }
    if (this.tournament?.battle_5) {
      const battle5Name = this.getBattleName(this.tournament.battle_5);
      this.tournamentOptions.push({ name: `5. ${battle5Name}`, value: 7 });
    }

    this.tournamentOptions.push({ name: 'Wyniki', value: 8 });
    this.tournamentOptions = [...this.tournamentOptions];
  }

  getBattleName(battleString: string): string {
    const [battleName] = battleString.split(';'); 
    return battleName || 'Domyślna bitwa'; 
  }

  selectedTournamentOptions(ev: any) {
    const val = ev.value;

    let path = '';
    if (val >= 3 && val <= 7) { 
      path = `battle/${val - 2}`; 
    } else if (val === 8) {
      path = 'result';
    } else if (val == 2){
      path = 'competition';
    } else {
      path = 'participant';
    }

    const tournamentId = this.tournament?._id;
    localStorage.setItem("tournamentOption", val.toString());  
    this.router.navigate([`/tournament/${tournamentId}/${path}`]);
  }

  syncRouteWithOption(): void {
    const url = this.router.url;
    
    if (url.includes('/battle/')) {
      const battleId = url.split('/battle/')[1];
      this.tournamentOption = Number(battleId) + 2; 
    } else if (url.includes('/result')) {
      this.tournamentOption = 8;  
    } else if (url.includes('/competition')) {
      this.tournamentOption = 2;  
    } else if (url.includes('/participant')) {
      this.tournamentOption = 1;  
    }

    localStorage.setItem("tournamentOption", this.tournamentOption.toString()); 
  }
}
