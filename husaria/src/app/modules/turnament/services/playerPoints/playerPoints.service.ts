import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CrudService } from 'src/app/shered/service/crud.service';
import { IPlayerPoints } from 'src/app/models/playerPoints';

@Injectable({ providedIn: 'root' })
export class PlayerPointsService {
  private readonly route = 'playerPoints';

  constructor(private crud: CrudService) {}

  getPlayerPointsForTournament(tournamentId: string): Observable<IPlayerPoints[]> {
    return this.crud.read<IPlayerPoints[]>(`${this.route}/tournament`, tournamentId);
  }

  create(data: Partial<IPlayerPoints>): Observable<IPlayerPoints> {
    return this.crud.create<Partial<IPlayerPoints>, IPlayerPoints>(this.route, data);
  }
  
  update(id: string, data: Partial<IPlayerPoints>) {
  return this.crud.update<Partial<IPlayerPoints>, IPlayerPoints>('playerPoints', id, data);
}

  delete(id: string): Observable<void> {
    return this.crud.delete(this.route, id);
  }
}
 

  