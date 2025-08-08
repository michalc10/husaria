import { Component, OnInit } from '@angular/core';
import { TournamentService } from '../../services/tournament/tournament.service';
import { ITournament } from 'src/app/models/tournament';

interface Obstacle {
  name: string;
  score: string;
}

interface Category {
  name: string;
  obstacles: Obstacle[];
}

interface Battle {
  name: string;
  categories: Category[];
}

@Component({
  selector: 'app-competition',
  templateUrl: './competition.component.html',
  styleUrls: ['./competition.component.scss'],
})
export class CompetitionComponent implements OnInit {
  tournament!: ITournament;
  battles: Battle[] = [];

  showBattle4 = false;
  showBattle5 = false;

  constructor(private tournamentService: TournamentService) {}

  ngOnInit(): void {
    const tournamentId = localStorage.getItem('tournamentId');
    if (tournamentId) {
      this.loadTournament(tournamentId);
    } else {
      this.battles = [
        this.parseBattle(''),
        this.parseBattle(''),
        this.parseBattle(''),
      ];
    }
  }

  loadTournament(idTournament: string): void {
    this.tournamentService
      .get(idTournament)
      .subscribe((tournament: ITournament) => {
        this.tournament = tournament;

        this.battles = [
          this.parseBattle(tournament.battle_1 || this.getDefaultBattle(1)),
          this.parseBattle(tournament.battle_2 || this.getDefaultBattle(2)),
          this.parseBattle(tournament.battle_3 || this.getDefaultBattle(3)),
        ];

        if (tournament.battle_4) {
          this.battles.push(this.parseBattle(tournament.battle_4));
          this.showBattle4 = true;
        }
        if (tournament.battle_5) {
          this.battles.push(this.parseBattle(tournament.battle_5));
          this.showBattle5 = true;
        }
      });
  }

  getDefaultBattle(number: number): string {
    if (number === 3) {
      return 'Kopia;/P1;Pierścień 1:6;/P2;Pierścień 2:6;/P3 beczka;Niższy chód:10;Ominięcie przeszkody:25;Demontaż przeszkody:25;/P4 skok;Zrzutka:5;Ominięcie przeszkody:25;Demontaż przeszkody:25;/P5;Pierścień 3:6;/Punkty karne;Utrata broni:5;Upadek jeźdźca:20;Upadek konia i jeźdźca:40';
    } else if (number === 2) {
      return 'Pałasz;/P1;Cięcie kapusty:6;/P2;Pchnięcie klocka:10;/P3 beczka;Niższy chód:10;Ominięcie przeszkody:25;Demontaż przeszkody:25;/P4 skok;Zrzutka:5;Ominięcie przeszkody:25;Demontaż przeszkody:25;/P5;Cięcie kapusty:6;/Punkty karne;Utrata broni:5;Upadek jeźdźca:20;Upadek konia i jeźdźca:40';
    } else {
      return 'Szabla;/P1;Cięcie łozy:6;/P2;Cięcie jabłka:6;/P3 beczka;Niższy chód:10;Ominięcie przeszkody:25;Demontaż przeszkody:25;/P4 skok;Zrzutka:5;Ominięcie przeszkody:25;Demontaż przeszkody:25;/P5;Cięcie jabłka:6;/Punkty karne;Utrata broni:5;Upadek jeźdźca:20;Upadek konia i jeźdźca:40';
    }
  }

  parseBattle(battleString: string): Battle {
    if (!battleString || battleString.trim() === '') {
      return {
        name: 'Default Battle',
        categories: [
          {
            name: 'Kategoria 1',
            obstacles: [{ name: 'Przeszkoda 1', score: '0' }],
          },
        ],
      };
    }

    const cleanBattleString = battleString
      .replace(/;{2,}/g, ';')
      .replace(/\/{2,}/g, '/')
      .replace(/;$/, '')
      .replace(/\/$/, '');
    const [battleName, ...categoryStrings] = cleanBattleString
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);

    const categories = categoryStrings.map((categoryString) => {
      const [categoryName, ...obstacleStrings] = categoryString
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      const obstacles = obstacleStrings.map((obstacleString) => {
        const [obstacleName, score] = obstacleString.split(':');
        return { name: obstacleName, score }; // Przechowujemy jako string
      });
      return { name: categoryName, obstacles };
    });

    return { name: battleName.split(';')[0], categories };
  }

  buildBattleString(battle: Battle): string {
    const categoryStrings = battle.categories.map((category) => {
      const obstacleStrings = category.obstacles.map(
        (obstacle) => `${obstacle.name}:${obstacle.score}`
      );
      return `${category.name};${obstacleStrings.join(';')}`;
    });
    return `${battle.name};/${categoryStrings.join('/')} `;
  }

  save(): void {
    this.tournament.battle_1 = this.buildBattleString(this.battles[0]);
    this.tournament.battle_2 = this.buildBattleString(this.battles[1]);
    this.tournament.battle_3 = this.buildBattleString(this.battles[2]);

    if (this.showBattle4) {
      this.tournament.battle_4 = this.buildBattleString(this.battles[3]);
    } else {
      this.tournament.battle_4 = '';
    }

    if (this.showBattle5) {
      this.tournament.battle_5 = this.buildBattleString(this.battles[4]);
    } else {
      this.tournament.battle_5 = '';
    }

    this.tournamentService
      .update(this.tournament._id!, this.tournament)
      .subscribe(
        (response) => {
          console.log('Dane zapisane na serwerze:', response, this.tournament._id);
          alert(`Zmiany zapisane!`);
        },
        (error) => {
          console.error('Błąd podczas zapisu:', error);
          alert('Błąd podczas zapisu zmian!');
        }
      );
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const allowedChars = /[0-9-]/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!allowedChars.test(inputChar) && event.charCode !== 0) {
      event.preventDefault();
    }
  }

  addBattle(): void {
    if (!this.showBattle4) {
      this.battles.push(this.parseBattle(''));
      this.showBattle4 = true;
    } else if (!this.showBattle5) {
      this.battles.push(this.parseBattle(''));
      this.showBattle5 = true;
    }
  }

  removeBattle(battleIndex: number): void {
    this.battles.splice(battleIndex, 1);
    if (battleIndex === 3) {
      this.showBattle4 = false;
    } else if (battleIndex === 4) {
      this.showBattle5 = false;
    }
  }

  addObstacle(battleIndex: number, categoryIndex: number): void {
    this.battles[battleIndex].categories[categoryIndex].obstacles.push({
      name: '',
      score: '0',
    });
  }

  removeObstacle(
    battleIndex: number,
    categoryIndex: number,
    obstacleIndex: number
  ): void {
    this.battles[battleIndex].categories[categoryIndex].obstacles.splice(
      obstacleIndex,
      1
    );
  }

  addCategory(battleIndex: number): void {
    this.battles[battleIndex].categories.push({
      name: 'Nowa kategoria',
      obstacles: [],
    });
  }

  removeCategory(battleIndex: number, categoryIndex: number): void {
    this.battles[battleIndex].categories.splice(categoryIndex, 1);
  }
}
