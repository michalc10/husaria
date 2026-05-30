// tournament.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/shered/service/crud.service';
import { ITournament, TournamentStatus } from 'src/app/models/tournament';
import { IBattle } from 'src/app/models/battle';

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private route = 'tournament';

  constructor(private crud: CrudService) {}

  get(id: string): Observable<ITournament> {
    return this.crud.read<ITournament>(this.route, id);
  }

  create(data: Partial<ITournament>): Observable<ITournament> {
    return this.crud.create<Partial<ITournament>, ITournament>(this.route, data);
  }

  update(id: string, data: Partial<ITournament>): Observable<ITournament> {
    return this.crud.update<Partial<ITournament>, ITournament>(this.route, id, data);
  }

  updateStatus(id: string, status: TournamentStatus): Observable<ITournament> {
    return this.crud.updatePath<{ status: TournamentStatus }, ITournament>(`${this.route}/${id}/status`, { status });
  }

  getBattles(tournamentId: string): Observable<IBattle[]> {
    return this.crud.list<IBattle>(`${this.route}/${tournamentId}/battles`);
  }

  saveBattles(tournamentId: string, battles: IBattle[]): Observable<IBattle[]> {
    return this.crud.updatePath<{ battles: IBattle[] }, IBattle[]>(`${this.route}/${tournamentId}/battles`, { battles });
  }

  listByLeague(leagueId: string): Observable<ITournament[]> {
    return this.crud.read<ITournament[]>('tournament/league', leagueId);
  }
}
