// tournament.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/shered/service/crud.service';
import { ITournament } from 'src/app/models/tournament';

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

  listByLeague(leagueId: string): Observable<ITournament[]> {
    return this.crud.read<ITournament[]>('tournament/league', leagueId);
  }
}