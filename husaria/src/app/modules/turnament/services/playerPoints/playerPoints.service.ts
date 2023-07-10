import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IPlayerPoints } from 'src/app/models/playerPoints';
import { api } from 'src/app/global';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayerPointsService {

  url = api + 'playerPoints'
  constructor(
    private http: HttpClient
  ) { }

  getPlayerPointsForTournament(idTournament: string): Observable<IPlayerPoints[]> {
    return this.http.get<IPlayerPoints[]>(this.url + '/tournament/' + idTournament)
  }

  create(playerPoints: any): Observable<IPlayerPoints> {
    return this.http.post<IPlayerPoints>(this.url, playerPoints)
  }

  update(id: String, data: IPlayerPoints): Observable<IPlayerPoints> {
    return this.http.put<IPlayerPoints>(this.url  + '/' + id, data);
  }

  
  delete( id: String): Observable<IPlayerPoints> {
    return this.http.delete<IPlayerPoints>(this.url + '/' + id);
  }

}
