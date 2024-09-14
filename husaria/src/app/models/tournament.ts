export interface ITournament{
    _id?:string;
    leagueId:string;
    city:string;
    date:Date;
    battle_1: string;
    battle_2: string;
    battle_3: string;
    battle_4: string;
    battle_5: string;

  [key: string]: any;
}