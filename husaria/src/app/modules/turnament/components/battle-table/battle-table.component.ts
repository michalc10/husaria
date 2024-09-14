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
  score: number;
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
  points: number[] = [];
  categories: Category[] = [];
  participantList: IPlayerPoints[] = [];
  battleId: string = '';

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
    
    // Przetwarzanie kategorii i przeszkód
    parts.forEach(part => {
      const [categoryName, ...obstacles] = part.split(';');
      const parsedObstacles = obstacles.map(obstacle => {
        const [name, score] = obstacle.split(':');
        return { name, score: parseInt(score, 10) };
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
    participant[`battle_${this.battleId}_score`] += value === 1 ? this.points[index] : -this.points[index];
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
      return participant[`battle_${this.battleId}_points`].charAt(index) === '1' ? total + point : total;
    }, 0);
  
    participant[`battle_${this.battleId}_score`] = baseScore +
      participant[`battle_${this.battleId}_extraPoints`] +
      participant[`battle_${this.battleId}_time`];
    
    // Trigger change detection if necessary (optional)
    this.participantList = [...this.participantList];  // Force Angular to detect changes
  }
  
  updatePlayerPoints(participant: IPlayerPoints, participantIndex: number) {
    // Assuming you have a method to update the points in the backend or local storage
    this.playerPointsService.update(participant._id!, participant).subscribe({
      next: (updatedParticipant) => {
        this.participantList[participantIndex] = updatedParticipant;
        this.participantList = [...this.participantList]; // Force change detection
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
    // Oblicz indeks punktu w `points` w zależności od kategorii i przeszkody
    let index = 0;
    for (let i = 0; i < categoryIndex; i++) {
      index += this.categories[i].obstacles.length;
    }
    return index + obstacleIndex;
  }
}
