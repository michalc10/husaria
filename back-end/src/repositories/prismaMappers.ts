export const toNumber = (value: unknown): number => {
  if (typeof value === 'object' && value && 'toNumber' in value && typeof value.toNumber === 'function') {
    return value.toNumber();
  }

  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};

export const mapLeague = (league: any) => ({
  _id: league.id,
  name: league.name,
  year: league.year
});

export const mapBanner = (banner: any) => ({
  _id: banner.id,
  name: banner.name,
  city: banner.city || ''
});

export const mapPlayer = (player: any) => ({
  _id: player.id,
  name: player.name,
  horse: player.horse,
  bannerId: player.bannerId ?? null,
  bannerName: player.banner?.name || player.flag || '',
  bannerCity: player.banner?.city || '',
  flag: player.banner?.name || player.flag || ''
});

export const mapTournament = (tournament: any) => ({
  _id: tournament.id,
  leagueId: tournament.leagueId,
  city: tournament.city,
  date: tournament.date,
  status: tournament.status || 'PLANNING'
});

export const mapCompetitionTemplate = (template: any) => ({
  _id: template.id,
  name: template.name,
  description: template.description || '',
  battles: template.battles || [],
  createdAt: template.createdAt,
  updatedAt: template.updatedAt
});

export const mapBattle = (battle: any) => ({
  _id: battle.id,
  tournamentId: battle.tournamentId,
  name: battle.name,
  order: battle.order,
  categories: [...(battle.categories || [])]
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      _id: category.id,
      battleId: category.battleId,
      name: category.name,
      order: category.order,
      obstacles: [...(category.obstacles || [])]
        .sort((a, b) => a.order - b.order)
        .map((obstacle) => ({
          _id: obstacle.id,
          categoryId: obstacle.categoryId,
          name: obstacle.name,
          order: obstacle.order,
          inputType: obstacle.inputType,
          score: toNumber(obstacle.score),
          scoreRaw: obstacle.scoreRaw,
          scoreOptions: obstacle.scoreOptions || undefined
        }))
    })),
  penalties: [...(battle.penalties || [])]
    .sort((a, b) => a.order - b.order)
    .map((penalty) => ({
      _id: penalty.id,
      battleId: penalty.battleId,
      name: penalty.name,
      order: penalty.order,
      score: toNumber(penalty.score)
    }))
});

export const mapBattleResult = (battleResult: any) => ({
  _id: battleResult.id,
  battleId: battleResult.battleId,
  tournamentPlayerId: battleResult.tournamentPlayerId,
  extraPoints: toNumber(battleResult.extraPoints),
  time: toNumber(battleResult.time),
  score: toNumber(battleResult.score),
  obstacleResults: [...(battleResult.obstacleResults || [])].map((result) => ({
    _id: result.id,
    obstacleId: result.obstacleId,
    value: result.value,
    score: toNumber(result.score)
  })),
  penaltyResults: [...(battleResult.penaltyResults || [])].map((result) => ({
    _id: result.id,
    penaltyId: result.penaltyId,
    selected: result.selected,
    score: toNumber(result.score)
  }))
});

export const mapBattleLiveState = (state: any) => ({
  battleId: state.battleId,
  activeTournamentPlayerId: state.activeTournamentPlayerId ?? null,
  version: state.version || 0,
  updatedAt: state.updatedAt,
  activeParticipant: state.activeTournamentPlayer
    ? {
        _id: state.activeTournamentPlayer.id,
        playerName: state.activeTournamentPlayer.playerName,
        horse: state.activeTournamentPlayer.horse,
        order: state.activeTournamentPlayer.order
      }
    : null
});

export const mapJudgeStation = (station: any, guestUrl?: string) => ({
  _id: station.id,
  tournamentId: station.tournamentId,
  battleId: station.battleId,
  categoryId: station.categoryId,
  label: station.label,
  revokedAt: station.revokedAt ?? null,
  createdAt: station.createdAt,
  lastSeenAt: station.lastSeenAt ?? null,
  ...(guestUrl ? { guestUrl } : {})
});

export const mapTournamentPlayer = (participant: any) => {
  const battleResults = [...(participant.battleResults || [])]
    .sort((a, b) => (a.battle?.order || 0) - (b.battle?.order || 0))
    .map(mapBattleResult);

  return {
    _id: participant.id,
    tournamentId: participant.tournamentId,
    playerId: participant.playerId,
    playerName: participant.playerName,
    horse: participant.horse,
    bannerId: participant.bannerId ?? null,
    bannerName: participant.banner?.name || participant.flag || '',
    bannerCity: participant.banner?.city || '',
    flag: participant.banner?.name || participant.flag || '',
    order: participant.order,
    totalScore: battleResults.reduce((total, result) => total + result.score, 0),
    battleResults
  };
};
