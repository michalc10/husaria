export type TournamentStatus = 'PLANNING' | 'LIVE' | 'FINISHED';

export interface ITournament{
    _id?:string;
    leagueId:string;
    city:string;
    date:Date;
    status:TournamentStatus;
    countsInLeagueStandings:boolean;

  [key: string]: any;
}
