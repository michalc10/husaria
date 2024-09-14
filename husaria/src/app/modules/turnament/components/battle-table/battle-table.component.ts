import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';
import { TournamentService } from '../../services/tournament/tournament.service';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { PageOrientation } from 'pdfmake/interfaces';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

interface Obstacle {
  name: string;
  score: string;  // Can be 'x-y-z-t'
}

interface Category {
  name: string;
  obstacles: Obstacle[];
}

@Component({
  selector: 'app-battle-table',
  templateUrl: './battle-table.component.html',
  styleUrls: ['./battle-table.component.scss']
})
export class BattleTableComponent implements OnInit {
  selectedPlayerId = '-1';
  points: string[] = [];
  categories: Category[] = [];
  participantList: IPlayerPoints[] = [];
  battleId: string = '';

  // Brick options for select button
  brickOptions = [
    { label: '0', value: '10' },
    { label: '1', value: '0' },
    { label: '2', value: '6' },
    { label: '3', value: '8' }
  ];

  constructor(
    private playerPointsService: PlayerPointsService,
    private route: ActivatedRoute,
    private tournamentService: TournamentService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.resetComponentState();
      this.battleId = params.get('battleId')!;
      
      const tournamentId = localStorage.getItem("tournamentId");
      if (tournamentId) {
        this.loadTournament(tournamentId);
      }
      this.loadParticipants();
    });
  }

  resetComponentState() {
    this.selectedPlayerId = '-1';
    this.points = [];
    this.categories = [];
    this.participantList = [];
    this.battleId = '';
  }

  loadTournament(idTournament: string): void {
    this.tournamentService.get(idTournament).subscribe((tournament: any) => {
      const battleString = tournament[`battle_${this.battleId}`];
      this.parseBattleData(battleString);
    });
  }

  loadParticipants() {
    const tournamentId = localStorage.getItem('tournamentId')!;
    
    this.playerPointsService.getPlayerPointsForTournament(tournamentId).subscribe({
      next: (value: IPlayerPoints[]) => {
        const battleNumber = Number(this.battleId);
        const currentBattlePointsKey = `battle_${this.battleId}_points`;
  
        const numberOfObstacles = this.points.length; 
  
        value.forEach(participant => {
          const currentValue = participant[currentBattlePointsKey] || '';
          const currentLength = currentValue.length;
          if (currentLength < numberOfObstacles) {
            const missingZeros = '0'.repeat(numberOfObstacles - currentLength);
            participant[currentBattlePointsKey] = currentValue + missingZeros;
          }
        });
  
        this.participantList = value.sort((a, b) => {
          let totalScoreA = 0;
          let totalScoreB = 0;
  
          for (let i = 1; i < battleNumber; i++) {
            const scoreKey = `battle_${i}_score`;
            totalScoreA += a[scoreKey] || 0;
            totalScoreB += b[scoreKey] || 0;
          }
  
          return totalScoreB - totalScoreA; 
        });
  
        this.participantList = [...this.participantList]; 
      }
    });
  }

  parseBattleData(battleString: string) {
    const parts = battleString.split('/').filter(part => part.trim() !== '').slice(1);
    
    parts.forEach(part => {
      const [categoryName, ...obstacles] = part.split(';');
      const parsedObstacles = obstacles.map(obstacle => {
        const [name, score] = obstacle.split(':');
        return { name, score };
      });
  
      this.categories.push({ name: categoryName, obstacles: parsedObstacles });
    });
  
    this.points = this.categories.flatMap(category => category.obstacles.map(o => o.score));
  }

  chosenRow(player: IPlayerPoints) {
    this.selectedPlayerId = player._id!;
  }

  changedButton(player: IPlayerPoints, index: number, value: number) {
    const participantIndex = this.participantList.findIndex(participant => participant._id === player._id);
    const currentBattlePointsKey = `battle_${this.battleId}_points`;
    const participant = this.participantList[participantIndex];
    const points = participant[currentBattlePointsKey];
    participant[currentBattlePointsKey] = points.substring(0, index) + value + points.substring(index + 1);
    participant[`battle_${this.battleId}_score`] += value === 1 ? parseInt(this.points[index]) : -parseInt(this.points[index]);
    this.updatePlayerPoints(participant, participantIndex);
  }

  setBrick(player: IPlayerPoints, index: number, event: any) {
    const participantIndex = this.participantList.findIndex(participant => participant._id === player._id);
    const participant = this.participantList[participantIndex];
    const currentPoints = participant[`battle_${this.battleId}_points`];
  
    // Zaktualizuj label w stringu battle_x_points
    participant[`battle_${this.battleId}_points`] = currentPoints.substring(0, index) + event.value + currentPoints.substring(index + 1);
  
    // Przelicz wynik na podstawie zaktualizowanej wartości
    this.calculateScore(participant);
    this.updatePlayerPoints(participant, participantIndex);
  }
  
  
  

  setExtraPoints(id: string, extraPoints: number) {
    const participantIndex = this.participantList.findIndex(participant => participant._id === id);
    const participant = this.participantList[participantIndex];
    participant[`battle_${this.battleId}_extraPoints`] = extraPoints;

    this.calculateScore(participant);
    this.updatePlayerPoints(participant, participantIndex);
  }

  setTime(player: IPlayerPoints, time: number) {
    const participantIndex = this.participantList.findIndex(participant => participant._id === player._id);
    const participant = this.participantList[participantIndex];
    participant[`battle_${this.battleId}_time`] = time;

    this.calculateScore(participant);
    this.updatePlayerPoints(participant, participantIndex);
  }

  calculateScore(participant: IPlayerPoints) {
    const baseScore = this.points.reduce((total, point, index) => {
      const currentPointChar = participant[`battle_${this.battleId}_points`].charAt(index);
      
      // Sprawdź, czy punkt zawiera "-" (czyli używamy brickOptions)
      if (point.includes('-')) {
        // Zwróć wartość `value` z brickOptions, jeśli `point` zawiera '-'
        const optionValue = this.brickOptions.find(option => option.label === currentPointChar)?.value || '0';
        return total + parseInt(optionValue, 10);
      } else {
        // W przeciwnym razie użyj normalnej logiki (0/1)
        return currentPointChar === '1' ? total + parseInt(point, 10) : total;
      }
    }, 0);
  
    // Aktualizujemy `score` na podstawie wartości `extraPoints` i `time`
    participant[`battle_${this.battleId}_score`] = baseScore +
      (participant[`battle_${this.battleId}_extraPoints`] || 0) +
      (participant[`battle_${this.battleId}_time`] || 0);
  
    // Wymuszenie przeliczenia wyników
    this.participantList = [...this.participantList];
  }
  
  
  

  updatePlayerPoints(participant: IPlayerPoints, participantIndex: number) {
    this.playerPointsService.update(participant._id!, participant).subscribe({
      next: (updatedParticipant) => {
        this.participantList[participantIndex] = updatedParticipant;
        this.participantList = [...this.participantList]; // Trigger change detection
      },
    });
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const allowedChars = /[0-9-]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!allowedChars.test(inputChar) && event.charCode !== 0) {
      event.preventDefault();
    }
  }

  isSelectButtonRequired(index: number): boolean {
    return this.points[index].includes('-');
  }

  getSelectButtonValue(rowData: IPlayerPoints, index: number): string {
    return rowData[`battle_${this.battleId}_points`].charAt(index);
  }
  

  generatePDF() {
    const tableBody = this.buildTableBody();
    const documentDefinition = {
      pageOrientation: 'landscape' as PageOrientation,
      content: [
        {
          table: {
            headerRows: 1,
            body: [
              [
                { text: 'Start', bold: true },
                { text: 'Imię', bold: true },
                ...this.categories.flatMap(category => category.obstacles.map(obstacle => ({ text: obstacle.name, bold: true }))),
                { text: 'Czas [s]', bold: true },
                { text: 'Wynik', bold: true },
              ],
              ...tableBody
            ]
          }
        }
      ]
    };

    pdfMake.createPdf(documentDefinition).open();
  }

  buildTableBody() {
    const body: any[] = [];
    let i = 1;
    this.participantList.forEach(row => {
      const participantPoints = this.categories.flatMap(category => 
        category.obstacles.map((_, index) => row[`battle_${this.battleId}_points`]?.charAt(index) === '1' ? 'X' : '')
      );
      body.push([
        i,
        row.playerName,
        ...participantPoints,
        row[`battle_${this.battleId}_time`],
        row[`battle_${this.battleId}_score`].toFixed(3)
      ]);
      i++;
    });
    return body;
  }

  getPointIndex(categoryIndex: number, obstacleIndex: number): number {
    let index = 0;
    for (let i = 0; i < categoryIndex; i++) {
      index += this.categories[i].obstacles.length;
    }
    return index + obstacleIndex;
  }
}
