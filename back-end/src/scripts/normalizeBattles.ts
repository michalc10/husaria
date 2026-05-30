import { Prisma } from '@prisma/client';
import { parseBattleDefinition, ParsedBattle, scoreObstacleValue } from '../battles/battleParser';
import { disconnectPrisma, prisma } from '../database/prisma';
import { createStableObjectId } from '../repositories/ids';

type LegacyBattleConfig = {
  order: number;
  definitionField: 'legacyBattle1' | 'legacyBattle2' | 'legacyBattle3' | 'legacyBattle4' | 'legacyBattle5';
  pointsField:
    | 'legacyBattle1Points'
    | 'legacyBattle2Points'
    | 'legacyBattle3Points'
    | 'legacyBattle4Points'
    | 'legacyBattle5Points';
  extraPointsField:
    | 'legacyBattle1ExtraPoints'
    | 'legacyBattle2ExtraPoints'
    | 'legacyBattle3ExtraPoints'
    | 'legacyBattle4ExtraPoints'
    | 'legacyBattle5ExtraPoints';
  timeField:
    | 'legacyBattle1Time'
    | 'legacyBattle2Time'
    | 'legacyBattle3Time'
    | 'legacyBattle4Time'
    | 'legacyBattle5Time';
  scoreField:
    | 'legacyBattle1Score'
    | 'legacyBattle2Score'
    | 'legacyBattle3Score'
    | 'legacyBattle4Score'
    | 'legacyBattle5Score';
};

type BattleItemRef =
  | { kind: 'obstacle'; id: string; obstacle: ParsedBattle['categories'][number]['obstacles'][number] }
  | { kind: 'penalty'; id: string; score: number };

const legacyBattles: LegacyBattleConfig[] = [
  {
    order: 1,
    definitionField: 'legacyBattle1',
    pointsField: 'legacyBattle1Points',
    extraPointsField: 'legacyBattle1ExtraPoints',
    timeField: 'legacyBattle1Time',
    scoreField: 'legacyBattle1Score'
  },
  {
    order: 2,
    definitionField: 'legacyBattle2',
    pointsField: 'legacyBattle2Points',
    extraPointsField: 'legacyBattle2ExtraPoints',
    timeField: 'legacyBattle2Time',
    scoreField: 'legacyBattle2Score'
  },
  {
    order: 3,
    definitionField: 'legacyBattle3',
    pointsField: 'legacyBattle3Points',
    extraPointsField: 'legacyBattle3ExtraPoints',
    timeField: 'legacyBattle3Time',
    scoreField: 'legacyBattle3Score'
  },
  {
    order: 4,
    definitionField: 'legacyBattle4',
    pointsField: 'legacyBattle4Points',
    extraPointsField: 'legacyBattle4ExtraPoints',
    timeField: 'legacyBattle4Time',
    scoreField: 'legacyBattle4Score'
  },
  {
    order: 5,
    definitionField: 'legacyBattle5',
    pointsField: 'legacyBattle5Points',
    extraPointsField: 'legacyBattle5ExtraPoints',
    timeField: 'legacyBattle5Time',
    scoreField: 'legacyBattle5Score'
  }
];

const toNumber = (value: unknown): number => {
  if (typeof value === 'object' && value && 'toNumber' in value && typeof value.toNumber === 'function') {
    return value.toNumber();
  }

  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
};

const charAtOrZero = (value: string, index: number) => value.charAt(index) || '0';

const scorePenaltyValue = (score: number, value: string) => (value !== '0' && value !== '' ? score : 0);

const legacyScoreFor = (participant: Record<string, unknown>, config: LegacyBattleConfig) =>
  toNumber(participant[config.scoreField]);

const legacyTotalFor = (participant: Record<string, unknown>) =>
  legacyBattles.reduce((total, config) => total + legacyScoreFor(participant, config), 0);

const recalculatedScoreFor = (
  parsedBattle: ParsedBattle,
  itemRefs: BattleItemRef[],
  points: string,
  extraPoints: number,
  time: number
) =>
  itemRefs.reduce((total, itemRef, index) => {
    const value = charAtOrZero(points, index);
    return (
      total +
      (itemRef.kind === 'obstacle'
        ? scoreObstacleValue(itemRef.obstacle, value)
        : scorePenaltyValue(itemRef.score, value))
    );
  }, 0) +
  extraPoints +
  time;

const createBattleTree = async (tx: Prisma.TransactionClient, tournamentId: string, config: LegacyBattleConfig, parsed: ParsedBattle) => {
  const battleId = createStableObjectId('battle', tournamentId, config.order);
  const itemRefs: BattleItemRef[] = [];

  await tx.battle.create({
    data: {
      id: battleId,
      tournamentId,
      name: parsed.name,
      order: config.order,
      legacyKey: `battle_${config.order}`
    }
  });

  for (const category of parsed.categories) {
    const categoryId = createStableObjectId('battle-category', battleId, category.order);

    await tx.battleCategory.create({
      data: {
        id: categoryId,
        battleId,
        name: category.name,
        order: category.order
      }
    });

    for (const obstacle of category.obstacles) {
      const obstacleId = createStableObjectId('battle-obstacle', categoryId, obstacle.order);

      await tx.battleObstacle.create({
        data: {
          id: obstacleId,
          categoryId,
          name: obstacle.name,
          order: obstacle.order,
          inputType: obstacle.inputType,
          score: obstacle.score,
          scoreRaw: obstacle.scoreRaw,
          scoreOptions: obstacle.scoreOptions as Prisma.InputJsonValue | undefined
        }
      });
    }
  }

  for (const penalty of parsed.penalties) {
    await tx.battlePenalty.create({
      data: {
        id: createStableObjectId('battle-penalty', battleId, penalty.order),
        battleId,
        name: penalty.name,
        order: penalty.order,
        score: penalty.score
      }
    });
  }

  parsed.legacyItems.forEach((item) => {
    if (item.kind === 'obstacle') {
      const category = parsed.categories[item.categoryIndex];
      const obstacle = category.obstacles[item.obstacleIndex];
      const categoryId = createStableObjectId('battle-category', battleId, category.order);
      itemRefs.push({
        kind: 'obstacle',
        id: createStableObjectId('battle-obstacle', categoryId, obstacle.order),
        obstacle
      });
      return;
    }

    const penalty = parsed.penalties[item.penaltyIndex];
    itemRefs.push({
      kind: 'penalty',
      id: createStableObjectId('battle-penalty', battleId, penalty.order),
      score: penalty.score
    });
  });

  return { battleId, itemRefs };
};

const run = async () => {
  const isDryRun = process.argv.includes('--dry-run');
  const tournaments = await prisma.tournament.findMany({
    include: {
      tournamentPlayers: true
    },
    orderBy: {
      date: 'asc'
    }
  });
  let battleCount = 0;
  let categoryCount = 0;
  let obstacleCount = 0;
  let penaltyCount = 0;
  let battleResultCount = 0;
  let obstacleResultCount = 0;
  let penaltyResultCount = 0;
  let legacyTotalScore = 0;
  let projectedTotalScore = 0;
  let recalculationMismatchCount = 0;

  const parsedByTournament = tournaments.map((tournament) => {
    const parsedBattles = legacyBattles
      .map((config) => ({
        config,
        raw: String(tournament[config.definitionField] || '').trim()
      }))
      .filter((entry) => entry.raw)
      .map((entry) => ({
        ...entry,
        parsed: parseBattleDefinition(entry.raw)
      }));

    battleCount += parsedBattles.length;
    parsedBattles.forEach(({ parsed }) => {
      categoryCount += parsed.categories.length;
      obstacleCount += parsed.categories.reduce((total, category) => total + category.obstacles.length, 0);
      penaltyCount += parsed.penalties.length;
    });

    tournament.tournamentPlayers.forEach((participant) => {
      legacyTotalScore += legacyTotalFor(participant);
      projectedTotalScore += legacyTotalFor(participant);
      battleResultCount += parsedBattles.length;

      parsedBattles.forEach(({ config, parsed }) => {
        obstacleResultCount += parsed.categories.reduce((total, category) => total + category.obstacles.length, 0);
        penaltyResultCount += parsed.penalties.length;

        const itemRefs: BattleItemRef[] = parsed.legacyItems.map((item) => {
          if (item.kind === 'obstacle') {
            const category = parsed.categories[item.categoryIndex];
            return { kind: 'obstacle', id: '', obstacle: category.obstacles[item.obstacleIndex] };
          }

          return { kind: 'penalty', id: '', score: parsed.penalties[item.penaltyIndex].score };
        });
        const recalculated = recalculatedScoreFor(
          parsed,
          itemRefs,
          String(participant[config.pointsField] || ''),
          toNumber(participant[config.extraPointsField]),
          toNumber(participant[config.timeField])
        );

        if (Math.abs(recalculated - legacyScoreFor(participant, config)) > 0.001) {
          recalculationMismatchCount += 1;
        }
      });
    });

    return { tournament, parsedBattles };
  });

  console.log('Normalized battle migration report:');
  console.log(`- tournaments: ${tournaments.length}`);
  console.log(`- battles: ${battleCount}`);
  console.log(`- categories: ${categoryCount}`);
  console.log(`- obstacles: ${obstacleCount}`);
  console.log(`- penalties: ${penaltyCount}`);
  console.log(`- battle results: ${battleResultCount}`);
  console.log(`- obstacle results: ${obstacleResultCount}`);
  console.log(`- penalty results: ${penaltyResultCount}`);
  console.log(`- legacy total score: ${legacyTotalScore.toFixed(3)}`);
  console.log(`- projected normalized total score: ${projectedTotalScore.toFixed(3)}`);
  console.log(`- recalculation differences preserved from legacy scores: ${recalculationMismatchCount}`);

  if (isDryRun) {
    console.log('Dry run complete. No data was written.');
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.battle.deleteMany();

      for (const { tournament, parsedBattles } of parsedByTournament) {
        for (const { config, parsed } of parsedBattles) {
          const { battleId, itemRefs } = await createBattleTree(tx, tournament.id, config, parsed);

          for (const participant of tournament.tournamentPlayers) {
            const battleResultId = createStableObjectId('battle-result', participant.id, battleId);
            const points = String(participant[config.pointsField] || '');
            const extraPoints = toNumber(participant[config.extraPointsField]);
            const time = toNumber(participant[config.timeField]);
            const legacyScore = legacyScoreFor(participant, config);

            await tx.battleResult.create({
              data: {
                id: battleResultId,
                tournamentPlayerId: participant.id,
                battleId,
                extraPoints,
                time,
                score: legacyScore
              }
            });

            for (const [index, itemRef] of itemRefs.entries()) {
              const value = charAtOrZero(points, index);

              if (itemRef.kind === 'obstacle') {
                await tx.obstacleResult.create({
                  data: {
                    id: createStableObjectId('obstacle-result', battleResultId, itemRef.id),
                    battleResultId,
                    obstacleId: itemRef.id,
                    value,
                    score: scoreObstacleValue(itemRef.obstacle, value)
                  }
                });
              } else {
                await tx.penaltyResult.create({
                  data: {
                    id: createStableObjectId('penalty-result', battleResultId, itemRef.id),
                    battleResultId,
                    penaltyId: itemRef.id,
                    selected: value !== '0' && value !== '',
                    score: scorePenaltyValue(itemRef.score, value)
                  }
                });
              }
            }
          }
        }
      }
    },
    { timeout: 60000 }
  );

  console.log('Normalized battle migration complete.');
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });

