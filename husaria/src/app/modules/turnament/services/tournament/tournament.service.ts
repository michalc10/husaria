import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { api } from 'src/app/global';
import { ITournament } from 'src/app/models/tournament';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {

  url = api + 'tournament'
  constructor(
    private http: HttpClient
  ) { }

  get(idTournament: string): Observable<ITournament> {
    return this.http.get<ITournament>(this.url +'/'+ idTournament)
  }

  create(playerPoints: any): Observable<ITournament> {
    return this.http.post<ITournament>(this.url, playerPoints)
  }

  update(id: String, data: ITournament): Observable<ITournament> {
    return this.http.put<ITournament>(this.url  + '/' + id, data);
  }

  
  delete( id: String): Observable<ITournament> {
    return this.http.delete<ITournament>(this.url + '/' + id);
  }
}
