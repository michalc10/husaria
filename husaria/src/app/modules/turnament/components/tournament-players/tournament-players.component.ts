import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { IPlayer } from 'src/app/models/player';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import { CrudService } from 'src/app/shered/service/crud.service';
import { PlayerPointsService } from '../../services/playerPoints/playerPoints.service';

@Component({
  selector: 'app-tournament-players',
  templateUrl: './tournament-players.component.html',
  styleUrls: ['./tournament-players.component.scss'],
})
export class TournamentPlayersComponent implements OnInit {
  sourceProducts: IPlayer[] = [];
  targetProducts: IPlayer[] = [];
  tournamentId = '';
  private pointsByPlayerId = new Map<string, IPlayerPoints>();

  constructor(
    private route: ActivatedRoute,
    private crudService: CrudService,
    private playerPointsService: PlayerPointsService
  ) {}

  ngOnInit(): void {
    const parent = this.route.parent ?? this.route;
    const id = parent.snapshot.paramMap.get('idTournament');
    if (!id) {
      console.error(
        'Brak param id w ścieżce /tournament/:idTournament/participant'
      );
      return;
    }
    this.tournamentId = id;

    forkJoin({
      points: this.playerPointsService.getPlayerPointsForTournament(id),
      players: this.crudService.list<IPlayer>('player'),
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
              flag: p.flag,
            };
          });

          const targetIds = new Set(target.map((t) => t._id));
          const source = players.filter((pl) => !targetIds.has(pl._id!));

          return { source, target };
        })
      )
      .subscribe({
        next: ({ source, target }) => {
          this.sourceProducts = source;
          this.targetProducts = target;
        },
        error: (err) => {
          console.error('Błąd inicjalizacji picklisty', err);
        },
      });
  }

  onMoveToTarget(event: any) {
    const items = event.items as IPlayer[];
    items.forEach((player) => {
      this.playerPointsService
        .create({
          tournamentId: this.tournamentId,
          playerName: player.name,
          horse: player.horse,
          flag: player.flag,
          playerId: player._id,
        })
        .subscribe({
          next: (pp) => this.pointsByPlayerId.set(pp.playerId, pp),
          error: (err) =>
            console.error('Nie udało się dodać zawodnika do turnieju', err),
        });
    });
  }

  onMoveToSource(event: any) {
    const items = event.items as IPlayer[];
    items.forEach((player) => {
      const pp = this.pointsByPlayerId.get(player._id!);
      if (pp?._id) {
        this.playerPointsService.delete(pp._id).subscribe({
          next: () => this.pointsByPlayerId.delete(player._id!),
          error: (err) =>
            console.error('Nie udało się usunąć zawodnika z turnieju', err),
        });
      }
    });
  }

  onMoveAllToTarget(event: any) {
    const items = event.items as IPlayer[];
    items.forEach((player) => this.onMoveToTarget({ items: [player] }));
  }

  onMoveAllToSource(event: any) {
    const items = event.items as IPlayer[];
    items.forEach((player) => this.onMoveToSource({ items: [player] }));
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

  onTargetReorder(event: any): void {
    this.persistTargetOrder();
  }

  private persistTargetOrder(): void {
    this.targetProducts.forEach((player, index) => {
      const pp = this.pointsByPlayerId.get(player._id!);
      if (pp && (pp as any).order !== index) {
        this.playerPointsService
          .update(pp._id!, { order: index } as any)
          .subscribe({
            error: (err) => console.error('Błąd zapisu kolejności', err),
          });
      }
    });
  }
}
