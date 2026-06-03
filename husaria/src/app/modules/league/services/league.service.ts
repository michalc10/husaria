import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from 'src/app/globals';
import {
  ICreateFinalTournamentPayload,
  ICreateFinalTournamentResponse,
  ILeagueStanding,
  ILeagueTeamStanding
} from 'src/app/models/leagueStanding';

@Injectable({ providedIn: 'root' })
export class LeagueService {
  constructor(private http: HttpClient) {}

  getStandings(leagueId: string, countedTournaments?: number): Observable<ILeagueStanding[]> {
    const params = new URLSearchParams();
    if (countedTournaments) {
      params.set('countedTournaments', String(countedTournaments));
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<ILeagueStanding[]>(`${API_BASE_URL}/league/${encodeURIComponent(leagueId)}/standings${query}`);
  }

  createFinalTournament(
    leagueId: string,
    payload: ICreateFinalTournamentPayload
  ): Observable<ICreateFinalTournamentResponse> {
    return this.http.post<ICreateFinalTournamentResponse>(
      `${API_BASE_URL}/league/${encodeURIComponent(leagueId)}/final-tournament`,
      payload
    );
  }

  getTeamStandings(leagueId: string, countedTournaments?: number, teamSize?: number): Observable<ILeagueTeamStanding[]> {
    const params = new URLSearchParams();
    if (countedTournaments) {
      params.set('countedTournaments', String(countedTournaments));
    }
    if (teamSize) {
      params.set('teamSize', String(teamSize));
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<ILeagueTeamStanding[]>(`${API_BASE_URL}/league/${encodeURIComponent(leagueId)}/team-standings${query}`);
  }
}
