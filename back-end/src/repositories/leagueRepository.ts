import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { BadRequestError } from './errors';
import { createObjectId, createStableObjectId } from './ids';
import { mapLeague, mapTournament, mapTournamentPlayer } from './prismaMappers';

type LeagueInput = {
  name: string;
  year: string;
  tournaments?: Array<{
    city?: string;
    date?: Date | string;
    countsInLeagueStandings?: boolean;
  }>;
};

type FinalTournamentInput = {
  finalistsCount?: number;
  countedTournaments?: number;
  city?: string;
  date?: Date | string;
  copyBattlesFromTournamentId?: string | null;
};

type LeagueStandingTournament = {
  tournamentId: string;
  city: string;
  date: Date;
  place: number;
  tournamentScore: number;
  leaguePoints: number;
  includedInLeagueScore?: boolean;
};

type LeagueStandingAccumulator = {
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
  bestPlace: number | null;
  tournaments: LeagueStandingTournament[];
};

type TeamStandingMember = {
  playerId: string;
  playerName: string;
  horse: string;
  tournamentScore: number;
};

type TeamStandingTournament = {
  tournamentId: string;
  city: string;
  date: Date;
  place: number;
  teamScore: number;
  leaguePoints: number;
  members: TeamStandingMember[];
  participantCount: number;
  includedInLeagueScore?: boolean;
};

type TeamStandingAccumulator = {
  bannerKey: string;
  bannerId: string | null;
  bannerName: string;
  bannerCity: string;
  starts: number;
  countedStarts: number;
  totalLeaguePoints: number;
  allLeaguePoints: number;
  bestPlace: number | null;
  tournaments: TeamStandingTournament[];
};

const round3 = (value: number) => Number((value || 0).toFixed(3));
const leaguePointsForPlace = (place: number) => Math.max(31 - place, 0);

const battleDefinitionInclude = {
  categories: {
    include: {
      obstacles: true
    },
    orderBy: {
      order: 'asc'
    }
  },
  penalties: {
    orderBy: {
      order: 'asc'
    }
  }
} satisfies Prisma.BattleInclude;

const scoreOptionsToJson = (value: unknown): Prisma.InputJsonValue | undefined => {
  if (!value) return undefined;
  return value as Prisma.InputJsonValue;
};

const compareParticipants = (a: any, b: any) =>
  (a.totalScore || 0) - (b.totalScore || 0) ||
  String(a.playerName || '').localeCompare(String(b.playerName || ''), 'pl') ||
  String(a.horse || '').localeCompare(String(b.horse || ''), 'pl') ||
  String(a._id || '').localeCompare(String(b._id || ''));

const compareStandings = (a: LeagueStandingAccumulator, b: LeagueStandingAccumulator) =>
  b.totalLeaguePoints - a.totalLeaguePoints ||
  (a.bestPlace ?? Number.MAX_SAFE_INTEGER) - (b.bestPlace ?? Number.MAX_SAFE_INTEGER) ||
  b.starts - a.starts ||
  a.playerName.localeCompare(b.playerName, 'pl') ||
  a.horse.localeCompare(b.horse, 'pl') ||
  a.playerId.localeCompare(b.playerId);

const compareTeamStandings = (a: TeamStandingAccumulator, b: TeamStandingAccumulator) =>
  b.totalLeaguePoints - a.totalLeaguePoints ||
  (a.bestPlace ?? Number.MAX_SAFE_INTEGER) - (b.bestPlace ?? Number.MAX_SAFE_INTEGER) ||
  b.starts - a.starts ||
  a.bannerName.localeCompare(b.bannerName, 'pl') ||
  a.bannerKey.localeCompare(b.bannerKey);

const bannerKey = (participant: ReturnType<typeof mapTournamentPlayer>) =>
  participant.bannerId || participant.bannerName || participant.flag || 'no-banner';

const selectCountedTournamentIds = <T extends { tournamentId: string; leaguePoints: number; place: number; date: Date }>(
  tournaments: T[],
  countedTournaments: number,
  scoreSelector: (result: T) => number
) =>
  new Set(
    [...tournaments]
      .sort((a, b) =>
        b.leaguePoints - a.leaguePoints ||
        a.place - b.place ||
        scoreSelector(a) - scoreSelector(b) ||
        a.date.getTime() - b.date.getTime()
      )
      .slice(0, countedTournaments)
      .map((result) => result.tournamentId)
  );

const cloneTournamentBattles = async (
  tx: Prisma.TransactionClient,
  sourceTournamentId: string,
  targetTournamentId: string
) => {
  const sourceBattles = await tx.battle.findMany({
    where: { tournamentId: sourceTournamentId },
    include: battleDefinitionInclude,
    orderBy: { order: 'asc' }
  });

  for (const sourceBattle of sourceBattles) {
    const battleId = createStableObjectId('battle', targetTournamentId, sourceBattle.order);

    await tx.battle.create({
      data: {
        id: battleId,
        tournamentId: targetTournamentId,
        name: sourceBattle.name,
        order: sourceBattle.order,
        revision: 1
      }
    });

    for (const sourceCategory of sourceBattle.categories) {
      const categoryId = createStableObjectId('battle-category', battleId, sourceCategory.order);

      await tx.battleCategory.create({
        data: {
          id: categoryId,
          battleId,
          name: sourceCategory.name,
          order: sourceCategory.order
        }
      });

      for (const sourceObstacle of sourceCategory.obstacles) {
        await tx.battleObstacle.create({
          data: {
            id: createStableObjectId('battle-obstacle', categoryId, sourceObstacle.order),
            categoryId,
            name: sourceObstacle.name,
            order: sourceObstacle.order,
            inputType: sourceObstacle.inputType,
            score: sourceObstacle.score,
            scoreRaw: sourceObstacle.scoreRaw,
            scoreOptions: scoreOptionsToJson(sourceObstacle.scoreOptions)
          }
        });
      }
    }

    for (const sourcePenalty of sourceBattle.penalties) {
      await tx.battlePenalty.create({
        data: {
          id: createStableObjectId('battle-penalty', battleId, sourcePenalty.order),
          battleId,
          name: sourcePenalty.name,
          order: sourcePenalty.order,
          score: sourcePenalty.score
        }
      });
    }
  }
};

const createEmptyResultsForParticipants = async (
  tx: Prisma.TransactionClient,
  tournamentId: string,
  participantIds: string[]
) => {
  if (!participantIds.length) return;

  const battles = await tx.battle.findMany({
    where: { tournamentId },
    include: battleDefinitionInclude
  });

  for (const participantId of participantIds) {
    for (const battle of battles) {
      const battleResultId = createStableObjectId('battle-result', participantId, battle.id);

      await tx.battleResult.create({
        data: {
          id: battleResultId,
          tournamentPlayerId: participantId,
          battleId: battle.id
        }
      });

      for (const category of battle.categories) {
        for (const obstacle of category.obstacles) {
          await tx.obstacleResult.create({
            data: {
              id: createStableObjectId('obstacle-result', battleResultId, obstacle.id),
              battleResultId,
              obstacleId: obstacle.id,
              value: '0',
              score: 0
            }
          });
        }
      }

      for (const penalty of battle.penalties) {
        await tx.penaltyResult.create({
          data: {
            id: createStableObjectId('penalty-result', battleResultId, penalty.id),
            battleResultId,
            penaltyId: penalty.id,
            selected: false,
            score: 0
          }
        });
      }
    }
  }
};

export const leagueRepository = {
  async create(input: LeagueInput) {
    return prisma.$transaction(async (tx) => {
      const league = await tx.league.create({
        data: {
          id: createObjectId(),
          name: input.name,
          year: input.year
        }
      });

      for (const tournament of input.tournaments || []) {
        await tx.tournament.create({
          data: {
            id: createObjectId(),
            leagueId: league.id,
            city: tournament.city || '',
            date: tournament.date ? new Date(tournament.date) : new Date(),
            countsInLeagueStandings: tournament.countsInLeagueStandings ?? true
          }
        });
      }

      return mapLeague(league);
    });
  },

  async findById(id: string) {
    const league = await prisma.league.findUnique({ where: { id } });
    return league ? mapLeague(league) : null;
  },

  async findAll() {
    const leagues = await prisma.league.findMany({ orderBy: [{ year: 'desc' }, { name: 'asc' }] });
    return leagues.map(mapLeague);
  },

  async findStandings(id: string, options: { countedTournaments?: number } = {}) {
    const league = await prisma.league.findUnique({ where: { id } });
    if (!league) return null;

    const tournaments = await prisma.tournament.findMany({
      where: { leagueId: id, countsInLeagueStandings: true },
      orderBy: [{ date: 'asc' }, { city: 'asc' }],
      include: {
        tournamentPlayers: {
          include: {
            banner: true,
            battleResults: {
              include: {
                battle: true,
                obstacleResults: true,
                penaltyResults: true
              }
            }
          }
        }
      }
    });
    const maxCountedTournaments = tournaments.length;
    const countedTournaments = maxCountedTournaments > 0
      ? Math.min(Math.max(options.countedTournaments || maxCountedTournaments, 1), maxCountedTournaments)
      : 0;
    const standings = new Map<string, LeagueStandingAccumulator>();

    for (const tournament of tournaments) {
      const participants = tournament.tournamentPlayers
        .map(mapTournamentPlayer)
        .sort(compareParticipants);

      participants.forEach((participant, index) => {
        const place = index + 1;
        const leaguePoints = leaguePointsForPlace(place);
        const existing = standings.get(participant.playerId);
        const tournamentResult: LeagueStandingTournament = {
          tournamentId: tournament.id,
          city: tournament.city,
          date: tournament.date,
          place,
          tournamentScore: round3(participant.totalScore || 0),
          leaguePoints
        };

        const next: LeagueStandingAccumulator = existing || {
          playerId: participant.playerId,
          playerName: participant.playerName,
          horse: participant.horse,
          bannerId: participant.bannerId ?? null,
          bannerName: participant.bannerName || participant.flag || '',
          bannerCity: participant.bannerCity || '',
          flag: participant.flag || participant.bannerName || '',
          starts: 0,
          countedStarts: 0,
          totalLeaguePoints: 0,
          allLeaguePoints: 0,
          bestPlace: null,
          tournaments: []
        };

        next.playerName = participant.playerName;
        next.horse = participant.horse;
        next.bannerId = participant.bannerId ?? null;
        next.bannerName = participant.bannerName || participant.flag || '';
        next.bannerCity = participant.bannerCity || '';
        next.flag = participant.flag || participant.bannerName || '';
        next.starts += 1;
        next.allLeaguePoints += leaguePoints;
        next.bestPlace = next.bestPlace === null ? place : Math.min(next.bestPlace, place);
        next.tournaments.push(tournamentResult);
        standings.set(participant.playerId, next);
      });
    }

    return [...standings.values()]
      .map((standing) => {
        const countedIds = selectCountedTournamentIds(
          standing.tournaments,
          countedTournaments,
          (result) => result.tournamentScore
        );
        const tournamentsWithIncludedFlag = standing.tournaments.map((tournament) => ({
          ...tournament,
          includedInLeagueScore: countedIds.has(tournament.tournamentId)
        }));
        const includedResults = tournamentsWithIncludedFlag.filter((tournament) => tournament.includedInLeagueScore);

        return {
          ...standing,
          countedStarts: includedResults.length,
          totalLeaguePoints: includedResults.reduce((total, tournament) => total + tournament.leaguePoints, 0),
          tournaments: tournamentsWithIncludedFlag
        };
      })
      .sort(compareStandings)
      .map((standing, index) => ({
        rank: index + 1,
        ...standing,
        totalLeaguePoints: Number(standing.totalLeaguePoints.toFixed(3)),
        allLeaguePoints: Number(standing.allLeaguePoints.toFixed(3)),
        countedTournaments,
        maxCountedTournaments,
        tournaments: standing.tournaments.sort((a, b) => a.date.getTime() - b.date.getTime())
      }));
  },

  async findTeamStandings(id: string, options: { countedTournaments?: number; teamSize?: number } = {}) {
    const league = await prisma.league.findUnique({ where: { id } });
    if (!league) return null;

    const tournaments = await prisma.tournament.findMany({
      where: { leagueId: id, countsInLeagueStandings: true },
      orderBy: [{ date: 'asc' }, { city: 'asc' }],
      include: {
        tournamentPlayers: {
          include: {
            banner: true,
            battleResults: {
              include: {
                battle: true,
                obstacleResults: true,
                penaltyResults: true
              }
            }
          }
        }
      }
    });
    const maxCountedTournaments = tournaments.length;
    const countedTournaments = maxCountedTournaments > 0
      ? Math.min(Math.max(options.countedTournaments || maxCountedTournaments, 1), maxCountedTournaments)
      : 0;
    const teamSize = Math.min(Math.max(Math.trunc(options.teamSize || 3), 1), 30);
    const standings = new Map<string, TeamStandingAccumulator>();

    for (const tournament of tournaments) {
      const participants = tournament.tournamentPlayers.map(mapTournamentPlayer).sort(compareParticipants);
      const byBanner = new Map<string, typeof participants>();

      for (const participant of participants) {
        const key = bannerKey(participant);
        byBanner.set(key, [...(byBanner.get(key) || []), participant]);
      }

      const tournamentTeams = [...byBanner.entries()]
        .map(([key, teamParticipants]) => {
          const sortedTeamParticipants = [...teamParticipants].sort(compareParticipants);
          const members = sortedTeamParticipants.slice(0, teamSize).map((participant) => ({
            playerId: participant.playerId,
            playerName: participant.playerName,
            horse: participant.horse,
            tournamentScore: round3(participant.totalScore || 0)
          }));

          return {
            key,
            bannerId: sortedTeamParticipants[0]?.bannerId ?? null,
            bannerName: sortedTeamParticipants[0]?.bannerName || sortedTeamParticipants[0]?.flag || '',
            bannerCity: sortedTeamParticipants[0]?.bannerCity || '',
            participantCount: sortedTeamParticipants.length,
            members,
            teamScore: round3(members.reduce((total, member) => total + member.tournamentScore, 0))
          };
        })
        .filter((team) => team.members.length >= teamSize)
        .sort((a, b) =>
          a.teamScore - b.teamScore ||
          a.bannerName.localeCompare(b.bannerName, 'pl') ||
          a.key.localeCompare(b.key)
        );

      tournamentTeams.forEach((team, index) => {
        const place = index + 1;
        const leaguePoints = leaguePointsForPlace(place);
        const existing = standings.get(team.key);
        const tournamentResult: TeamStandingTournament = {
          tournamentId: tournament.id,
          city: tournament.city,
          date: tournament.date,
          place,
          teamScore: team.teamScore,
          leaguePoints,
          members: team.members,
          participantCount: team.participantCount
        };
        const next: TeamStandingAccumulator = existing || {
          bannerKey: team.key,
          bannerId: team.bannerId,
          bannerName: team.bannerName,
          bannerCity: team.bannerCity,
          starts: 0,
          countedStarts: 0,
          totalLeaguePoints: 0,
          allLeaguePoints: 0,
          bestPlace: null,
          tournaments: []
        };

        next.bannerId = team.bannerId;
        next.bannerName = team.bannerName;
        next.bannerCity = team.bannerCity;
        next.starts += 1;
        next.allLeaguePoints += leaguePoints;
        next.bestPlace = next.bestPlace === null ? place : Math.min(next.bestPlace, place);
        next.tournaments.push(tournamentResult);
        standings.set(team.key, next);
      });
    }

    return [...standings.values()]
      .map((standing) => {
        const countedIds = selectCountedTournamentIds(
          standing.tournaments,
          countedTournaments,
          (result) => result.teamScore
        );
        const tournamentsWithIncludedFlag = standing.tournaments.map((tournament) => ({
          ...tournament,
          includedInLeagueScore: countedIds.has(tournament.tournamentId)
        }));
        const includedResults = tournamentsWithIncludedFlag.filter((tournament) => tournament.includedInLeagueScore);

        return {
          ...standing,
          countedStarts: includedResults.length,
          totalLeaguePoints: includedResults.reduce((total, tournament) => total + tournament.leaguePoints, 0),
          tournaments: tournamentsWithIncludedFlag
        };
      })
      .sort(compareTeamStandings)
      .map((standing, index) => ({
        rank: index + 1,
        ...standing,
        totalLeaguePoints: Number(standing.totalLeaguePoints.toFixed(3)),
        allLeaguePoints: Number(standing.allLeaguePoints.toFixed(3)),
        countedTournaments,
        maxCountedTournaments,
        teamSize,
        tournaments: standing.tournaments.sort((a, b) => a.date.getTime() - b.date.getTime())
      }));
  },

  async createFinalTournament(id: string, input: FinalTournamentInput) {
    const standings = await leagueRepository.findStandings(id, {
      countedTournaments: input.countedTournaments
    });

    if (!standings) return null;
    if (!standings.length) {
      throw new BadRequestError('Nie można utworzyć finału, bo klasyfikacja indywidualna jest pusta.');
    }

    const finalistsCount = Math.min(
      Math.max(Math.trunc(Number(input.finalistsCount || 10)), 1),
      standings.length
    );
    const finalists = standings.slice(0, finalistsCount);

    return prisma.$transaction(async (tx) => {
      const copyBattlesFromTournamentId = input.copyBattlesFromTournamentId || null;

      if (copyBattlesFromTournamentId) {
        const sourceTournament = await tx.tournament.findUnique({
          where: { id: copyBattlesFromTournamentId },
          select: { leagueId: true }
        });

        if (!sourceTournament || sourceTournament.leagueId !== id) {
          throw new BadRequestError('Turniej źródłowy konkurencji nie należy do tej ligi.');
        }
      }

      const tournament = await tx.tournament.create({
        data: {
          id: createObjectId(),
          leagueId: id,
          city: input.city || 'Finał',
          date: input.date ? new Date(input.date) : new Date(),
          status: 'PLANNING',
          countsInLeagueStandings: false
        }
      });

      if (copyBattlesFromTournamentId) {
        await cloneTournamentBattles(tx, copyBattlesFromTournamentId, tournament.id);
      }

      const participantIds: string[] = [];

      for (const [index, finalist] of finalists.entries()) {
        const participant = await tx.tournamentPlayer.create({
          data: {
            id: createObjectId(),
            tournamentId: tournament.id,
            playerId: finalist.playerId,
            playerName: finalist.playerName,
            horse: finalist.horse,
            bannerId: finalist.bannerId,
            flag: finalist.flag || finalist.bannerName || '',
            order: index + 1
          }
        });

        participantIds.push(participant.id);
      }

      await createEmptyResultsForParticipants(tx, tournament.id, participantIds);

      return {
        tournament: mapTournament(tournament),
        finalists: finalists.map((finalist) => ({
          rank: finalist.rank,
          playerId: finalist.playerId,
          playerName: finalist.playerName,
          horse: finalist.horse,
          totalLeaguePoints: finalist.totalLeaguePoints,
          countedStarts: finalist.countedStarts
        }))
      };
    });
  },

  async update(id: string, body: Partial<LeagueInput>) {
    const existing = await prisma.league.findUnique({ where: { id } });
    if (!existing) return null;

    const league = await prisma.league.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.year !== undefined ? { year: body.year } : {})
      }
    });
    return mapLeague(league);
  },

  async delete(id: string) {
    const existing = await prisma.league.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.league.delete({ where: { id } });
    return existing;
  }
};
