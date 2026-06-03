export interface ILeagueStandingTournament {
  tournamentId: string;
  city: string;
  date: string | Date;
  place: number;
  tournamentScore: number;
  leaguePoints: number;
  includedInLeagueScore: boolean;
}

export interface ILeagueStanding {
  rank: number;
  playerId: string;
  playerName: string;
  horse: string;
  bannerId: string | null;
  bannerName: string;
  bannerCity: string;
  flag: string;
  starts: number;
  countedStarts: number;
  totalLeaguePoints: number;
  allLeaguePoints: number;
  countedTournaments: number;
  maxCountedTournaments: number;
  bestPlace: number | null;
  tournaments: ILeagueStandingTournament[];
}

export interface ICreateFinalTournamentPayload {
  finalistsCount?: number;
  countedTournaments?: number;
  city?: string;
  date?: string | Date;
  copyBattlesFromTournamentId?: string | null;
}

export interface IFinalTournamentFinalist {
  rank: number;
  playerId: string;
  playerName: string;
  horse: string;
  totalLeaguePoints: number;
  countedStarts: number;
}

export interface ICreateFinalTournamentResponse {
  tournament: import('./tournament').ITournament;
  finalists: IFinalTournamentFinalist[];
}

export interface ILeagueTeamStandingMember {
  playerId: string;
  playerName: string;
  horse: string;
  tournamentScore: number;
}

export interface ILeagueTeamStandingTournament {
  tournamentId: string;
  city: string;
  date: string | Date;
  place: number;
  teamScore: number;
  leaguePoints: number;
  members: ILeagueTeamStandingMember[];
  participantCount: number;
  includedInLeagueScore: boolean;
}

export interface ILeagueTeamStanding {
  rank: number;
  bannerKey: string;
  bannerId: string | null;
  bannerName: string;
  bannerCity: string;
  starts: number;
  countedStarts: number;
  totalLeaguePoints: number;
  allLeaguePoints: number;
  countedTournaments: number;
  maxCountedTournaments: number;
  teamSize: number;
  bestPlace: number | null;
  tournaments: ILeagueTeamStandingTournament[];
}
