import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { forkJoin, map } from 'rxjs';
import { IPlayer } from 'src/app/models/player';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import { CrudService } from 'src/app/shered/service/crud.service';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';

@Component({
  selector: 'app-tournament-players',
  templateUrl: './tournament-players.component.html',
  styleUrls: ['./tournament-players.component.scss'],
  standalone: false
})
export class TournamentPlayersComponent implements OnInit {
  sourceProducts: IPlayer[] = [];
  targetProducts: IPlayer[] = [];
  tournamentId = '';
  private pointsByPlayerId = new Map<string, IPlayerPoints>();

  constructor(
    private route: ActivatedRoute,
    private crudService: CrudService,
    private playerPointsService: PlayerPointsService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    const parent = this.route.parent ?? this.route;
    const id = parent.snapshot.paramMap.get('idTournament');
    if (!id) {
      console.error(this.transloco.translate('tournament.missingRoute'));
      return;
    }
    this.tournamentId = id;

    this.loadPlayers();
  }

  onMoveToTarget(event: any): void {
    const items = event.items as IPlayer[];
    const requests = items.map((player) =>
      this.playerPointsService.create({
        tournamentId: this.tournamentId,
        playerName: player.name,
        horse: player.horse,
        bannerId: player.bannerId,
        flag: player.flag,
        playerId: player._id
      })
    );

    if (!requests.length) return;

    forkJoin(requests).subscribe({
      next: () => this.loadPlayers(),
      error: (err) =>
        console.error(this.transloco.translate('tournament.addParticipantError'), err)
    });
  }

  onMoveToSource(event: any): void {
    const items = event.items as IPlayer[];
    const requests = items
      .map((player) => this.pointsByPlayerId.get(player._id!)?._id)
      .filter((id): id is string => !!id)
      .map((id) => this.playerPointsService.delete(id));

    if (!requests.length) return;

    forkJoin(requests).subscribe({
      next: () => this.loadPlayers(),
      error: (err) =>
        console.error(this.transloco.translate('tournament.removeParticipantError'), err)
    });
  }

  getInitials(name?: string): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase();
  }

  isInTarget(player: IPlayer): boolean {
    return this.targetProducts.some((p) => p._id === player._id);
  }

  getTargetIndex(player: IPlayer): number {
    const idx = this.targetProducts.findIndex((p) => p._id === player._id);
    return idx >= 0 ? idx + 1 : 0;
  }

  bannerLabel(player: IPlayer): string {
    const name = player.bannerName || player.flag || '';
    const city = player.bannerCity || '';
    return city ? `${name} (${city})` : name || this.transloco.translate('common.dash');
  }

  onTargetReorder(_: any): void {
    this.persistTargetOrder();
  }

  private loadPlayers(): void {
    forkJoin({
      points: this.playerPointsService.getPlayerPointsForTournament(this.tournamentId),
      players: this.crudService.list<IPlayer>('player')
    })
      .pipe(
        map(({ points, players }) => {
          this.pointsByPlayerId.clear();

          const target = points.map((p) => {
            this.pointsByPlayerId.set(p.playerId, p);
            return <IPlayer>{
              _id: p.playerId,
              name: p.playerName,
              horse: p.horse,
              bannerId: p.bannerId,
              bannerName: p.bannerName,
              bannerCity: p.bannerCity,
              flag: p.flag
            };
          });

          const targetIds = new Set(target.map((t) => t._id));
          const source = players.filter((player) => !targetIds.has(player._id!));

          return { source, target };
        })
      )
      .subscribe({
        next: ({ source, target }) => {
          this.sourceProducts = source;
          this.targetProducts = target;
        },
        error: (err) => {
          console.error(this.transloco.translate('tournament.picklistInitError'), err);
        }
      });
  }

  private persistTargetOrder(): void {
    const requests = this.targetProducts.reduce<ReturnType<PlayerPointsService['update']>[]>((acc, player, index) => {
      const pp = this.pointsByPlayerId.get(player._id!);
      if (pp && (pp as any).order !== index) {
        acc.push(this.playerPointsService.update(pp._id!, { order: index } as any));
      }
      return acc;
    }, []);

    if (!requests.length) return;

    forkJoin(requests).subscribe({
      next: () => this.loadPlayers(),
      error: (err) => console.error(this.transloco.translate('tournament.saveOrderError'), err)
    });
  }
}
