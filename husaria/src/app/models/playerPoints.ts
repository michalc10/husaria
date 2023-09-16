export interface IPlayerPoints {
    _id?: string,
    tournamentId: string;
    playerName: string,
    horse: string,
    flag: string,
    playerId: string,

    sabrePoints: string,
    sabreExtraPoints: number,
    sabreTime: number,
    sabreScore: number,

    broadswordPoints: string,
    broadswordExtraPoints: number,
    broadswordTime: number,
    broadswordScore: number,

    lancePoints: string,
    lanceExtraPoints: number,
    lanceTime: number,
    lanceScore: number,

    penalty: number,
    score: number

}