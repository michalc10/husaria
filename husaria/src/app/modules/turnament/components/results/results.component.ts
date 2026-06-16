import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { PageOrientation } from 'pdfmake/interfaces';
import { Subscription } from 'rxjs';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';

(pdfMake as any).vfs = (pdfFonts as any)['pdfMake']?.vfs ?? (pdfFonts as any).vfs;

interface PlayersWithTotalScore {
  bannerId: string | null;
  bannerName: string;
  bannerCity: string;
  totalScore: number;
  players: IPlayerPoints[];
}

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
  standalone: false
})
export class ResultsComponent implements OnInit, OnDestroy {
  pdfTextSize = 15;
  selectedPlayerId = '-1';
  participantList: IPlayerPoints[] = [];
  tournamentId = '-1';
  orientationList: Array<{ label: string; value: 'asc' | 'desc' }> = [];
  orientationPaper: Array<{ label: string; value: PageOrientation }> = [];
  chosenOrientationList: 'asc' | 'desc' = 'asc';
  chosenOrientationPaper: PageOrientation = 'landscape';

  resultOptions: any[] = [
    { label: '', valueResultOption: 'individualResults' },
    { label: '', valueResultOption: 'teamResults' }
  ];
  valueResultOption = 'individualResults';

  top3Players: PlayersWithTotalScore[] = [];
  private readonly translationSubscription = new Subscription();

  constructor(
    private playerPointsService: PlayerPointsService,
    private route: ActivatedRoute,
    private transloco: TranslocoService
  ) {
    this.translationSubscription.add(
      this.transloco.selectTranslation().subscribe(() => this.refreshLabels())
    );
  }

  ngOnInit(): void {
    this.tournamentId = this.route.parent?.snapshot.paramMap.get('idTournament') ?? '-1';
    if (this.tournamentId === '-1') {
      console.error(this.transloco.translate('battleTable.missingRoute'));
      return;
    }

    this.playerPointsService.getPlayerPointsForTournament(this.tournamentId).subscribe({
      next: (value: IPlayerPoints[]) => {
        this.participantList = this.sortParticipants(value.map(participant => ({
          ...participant,
          score: this.calculateTotalScore(participant)
        })));
      }
    });
  }

  ngOnDestroy(): void {
    this.translationSubscription.unsubscribe();
  }

  calculateTotalScore(player: IPlayerPoints): number {
    const totalScore = player.totalScore ?? (player.battleResults || []).reduce((total, result) => total + (result.score || 0), 0);
    return Number((totalScore || 0).toFixed(3));
  }

  exportPdf(): void {
    const sortedParticipants = this.sortParticipants([...this.participantList]);
    const tableBody = this.buildTableBody(sortedParticipants);
    const orientation = this.chosenOrientationPaper;

    const documentDefinition = this.valueResultOption === this.resultOptions[0].valueResultOption ? {
      pageOrientation: orientation as PageOrientation,
      content: [
        {
          table: {
            headerRows: 1,
            body: [
              [
                { text: this.transloco.translate('results.rank'), bold: true },
                { text: this.transloco.translate('results.player'), bold: true },
                { text: this.transloco.translate('results.horse'), bold: true },
                { text: this.transloco.translate('results.banner'), bold: true },
                { text: this.transloco.translate('results.city'), bold: true },
                { text: this.transloco.translate('results.score'), bold: true }
              ],
              ...tableBody
            ]
          }
        }
      ],
      defaultStyle: {
        fontSize: this.pdfTextSize
      }
    } : {
      pageOrientation: orientation as PageOrientation,
      content: [
        {
          table: {
            headerRows: 1,
            body: [
              [
                '',
                this.transloco.translate('results.banner'),
                this.transloco.translate('results.city'),
                this.transloco.translate('results.player'),
                this.transloco.translate('results.horse'),
                this.transloco.translate('results.points'),
                this.transloco.translate('results.sum')
              ],
              ...this.sortTeams(this.getTop3Players())
                .map((team, rowIndex) => [
                  rowIndex + 1,
                  team.bannerName,
                  team.bannerCity,
                  team.players.map(player => player.playerName).join('\n'),
                  team.players.map(player => player.horse).join('\n'),
                  team.players.map(player => this.playerScore(player).toFixed(3)).join('\n'),
                  team.totalScore.toFixed(3)
                ])
            ]
          }
        }
      ],
      defaultStyle: {
        fontSize: this.pdfTextSize
      }
    };

    pdfMake.createPdf(documentDefinition).open();
  }

  buildTableBody(data: IPlayerPoints[]): Array<Array<string | number>> {
    return data.map((row, index) => [
      index + 1,
      row.playerName,
      row.horse,
      this.bannerName(row),
      this.bannerCity(row),
      this.playerScore(row).toFixed(3)
    ]);
  }

  getTop3Players(): PlayersWithTotalScore[] {
    const top3ByBanner: Record<string, IPlayerPoints[]> = {};

    this.sortParticipants([...this.participantList]).forEach(player => {
      const key = player.bannerId || this.bannerName(player);
      if (!top3ByBanner[key]) {
        top3ByBanner[key] = [];
      }

      if (top3ByBanner[key].length < 3) {
        top3ByBanner[key].push(player);
      }
    });

    this.top3Players = Object.entries(top3ByBanner).map(([bannerId, players]) => ({
      bannerId,
      bannerName: this.bannerName(players[0]),
      bannerCity: this.bannerCity(players[0]),
      players,
      totalScore: Number(players.reduce((total, player) => total + this.playerScore(player), 0).toFixed(3))
    }));

    return this.sortTeams(this.top3Players);
  }

  playerScore(player: IPlayerPoints): number {
    return player.score ?? this.calculateTotalScore(player);
  }

  bannerName(player: IPlayerPoints): string {
    return player.bannerName || player.flag || this.transloco.translate('banner.none');
  }

  bannerCity(player: IPlayerPoints): string {
    return player.bannerCity || '';
  }

  private sortParticipants(participants: IPlayerPoints[]): IPlayerPoints[] {
    return participants.sort((a, b) =>
      this.chosenOrientationList === 'asc'
        ? this.playerScore(a) - this.playerScore(b)
        : this.playerScore(b) - this.playerScore(a)
    );
  }

  private sortTeams(teams: PlayersWithTotalScore[]): PlayersWithTotalScore[] {
    return teams.sort((a, b) =>
      this.chosenOrientationList === 'asc'
        ? a.totalScore - b.totalScore
        : b.totalScore - a.totalScore
    );
  }

  private refreshLabels(): void {
    this.orientationList = [
      { label: this.label('results.ascending', 'rosnąco'), value: 'asc' },
      { label: this.label('results.descending', 'malejąco'), value: 'desc' }
    ];
    this.orientationPaper = [
      { label: this.label('results.horizontal', 'poziomo'), value: 'landscape' },
      { label: this.label('results.vertical', 'pionowo'), value: 'portrait' }
    ];
    this.resultOptions = [
      { label: this.label('results.individual', 'Indywidualne'), valueResultOption: 'individualResults' },
      { label: this.label('results.team', 'Drużynowe'), valueResultOption: 'teamResults' }
    ];
  }

  private label(key: string, fallback: string): string {
    const value = this.transloco.translate(key);
    return value === key ? fallback : value;
  }
}
