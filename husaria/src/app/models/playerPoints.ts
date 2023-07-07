export interface IPlayerPoints {
    _id?: string,
    tournamentId: string;
    playerName: string,
    horse: string,
    flag: string,
    playerId: string,

    sabrePoints: string,
    sabreTime: number,
    sabreScore: number,

    broadswordPoints: string,
    broadswordTime: number,
    broadswordScore: number,

    lancePoints: string,
    lanceTime: number,
    lanceScore: number,

    penalty: number,
    score: number

}