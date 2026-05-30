export interface ILeague{
    _id?:string;
    year:string;
    name:string;
    tournaments?: Array<Partial<import('./tournament').ITournament>>;
}
