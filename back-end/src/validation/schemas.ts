import { z } from 'zod';

const requiredString = (field: string) =>
  z.string({ error: `Pole "${field}" jest wymagane` }).trim().min(1, `Pole "${field}" jest wymagane`);

const optionalString = z.string().trim().optional();
const optionalNumber = z.coerce.number().finite().optional();
const email = requiredString('email').email('Podaj poprawny adres e-mail').transform(value => value.toLowerCase());
const password = requiredString('password').min(8, 'Hasło musi mieć co najmniej 8 znaków');
const userRole = z.enum(['ADMIN', 'JUDGE']);
const tournamentStatus = z.enum(['PLANNING', 'LIVE', 'FINISHED']);

const objectId = (field: string) =>
  requiredString(field).regex(/^[a-f\d]{24}$/i, `Pole "${field}" musi być poprawnym identyfikatorem`);

const optionalObjectId = (field: string) => objectId(field).optional();
const nullableObjectId = (field: string) => objectId(field).nullable().optional();

export const createPlayerSchema = z
  .object({
    name: requiredString('name'),
    horse: requiredString('horse'),
    bannerId: objectId('bannerId'),
    flag: optionalString
  })
  .strict();

export const updatePlayerSchema = z
  .object({
    name: requiredString('name').optional(),
    horse: requiredString('horse').optional(),
    bannerId: nullableObjectId('bannerId'),
    flag: optionalString
  })
  .strict();

export const createBannerSchema = z
  .object({
    name: requiredString('name'),
    city: optionalString.default('')
  })
  .strict();

export const updateBannerSchema = createBannerSchema.partial();

export const createLeagueSchema = z
  .object({
    name: requiredString('name'),
    year: requiredString('year'),
    tournaments: z
      .array(
        z
          .object({
            city: optionalString.default(''),
            date: z.coerce.date().optional()
          })
          .strict()
      )
      .optional()
  })
  .strict();

export const updateLeagueSchema = z
  .object({
    name: requiredString('name').optional(),
    year: requiredString('year').optional()
  })
  .strict();

export const createTournamentSchema = z
  .object({
    leagueId: objectId('leagueId'),
    city: optionalString.default(''),
    date: z.coerce.date().optional(),
    status: tournamentStatus.default('PLANNING')
  })
  .strict();

export const updateTournamentSchema = z
  .object({
    leagueId: objectId('leagueId').optional(),
    city: optionalString,
    date: z.coerce.date().optional(),
    status: tournamentStatus.optional()
  })
  .strict();

export const updateTournamentStatusSchema = z
  .object({
    status: tournamentStatus
  })
  .strict();

const scoreOptionSchema = z
  .object({
    code: requiredString('code'),
    label: requiredString('label'),
    score: z.coerce.number().finite()
  })
  .strict();

const obstacleSchema = z
  .object({
    _id: optionalObjectId('_id'),
    name: requiredString('name'),
    order: z.coerce.number().int().min(1),
    inputType: z.enum(['toggle', 'select']).default('toggle'),
    score: z.coerce.number().finite().default(0),
    scoreRaw: optionalString.default(''),
    scoreOptions: z.array(scoreOptionSchema).optional()
  })
  .strict();

const battleCategorySchema = z
  .object({
    _id: optionalObjectId('_id'),
    name: requiredString('name'),
    order: z.coerce.number().int().min(1),
    obstacles: z.array(obstacleSchema).default([])
  })
  .strict();

const battlePenaltySchema = z
  .object({
    _id: optionalObjectId('_id'),
    name: requiredString('name'),
    order: z.coerce.number().int().min(1),
    score: z.coerce.number().finite().default(0)
  })
  .strict();

const battleSchema = z
  .object({
    _id: optionalObjectId('_id'),
    name: requiredString('name'),
    order: z.coerce.number().int().min(1),
    categories: z.array(battleCategorySchema).default([]),
    penalties: z.array(battlePenaltySchema).default([])
  })
  .strict();

const battleTemplateSchema = battleSchema.omit({ _id: true }).extend({
  categories: z
    .array(
      battleCategorySchema.omit({ _id: true }).extend({
        obstacles: z.array(obstacleSchema.omit({ _id: true })).default([])
      })
    )
    .default([]),
  penalties: z.array(battlePenaltySchema.omit({ _id: true })).default([])
});

export const updateTournamentBattlesSchema = z
  .object({
    battles: z.array(battleSchema)
  })
  .strict();

export const createCompetitionTemplateSchema = z
  .object({
    name: requiredString('name'),
    description: optionalString.default(''),
    battles: z.array(battleTemplateSchema).min(1, 'Szablon musi zawierać co najmniej jedną konkurencję')
  })
  .strict();

export const updateCompetitionTemplateSchema = createCompetitionTemplateSchema.partial();

export const createPlayerPointsSchema = z
  .object({
    tournamentId: objectId('tournamentId'),
    playerName: requiredString('playerName'),
    horse: requiredString('horse'),
    bannerId: nullableObjectId('bannerId'),
    flag: optionalString,
    playerId: objectId('playerId'),
    order: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const updatePlayerPointsSchema = z
  .object({
    tournamentId: objectId('tournamentId').optional(),
    playerName: requiredString('playerName').optional(),
    horse: requiredString('horse').optional(),
    bannerId: nullableObjectId('bannerId'),
    flag: optionalString,
    playerId: objectId('playerId').optional(),
    order: z.coerce.number().int().min(0).optional()
  })
  .strict();

export const updateBattleResultSchema = z
  .object({
    extraPoints: optionalNumber,
    time: optionalNumber,
    obstacleResults: z
      .array(
        z
          .object({
            obstacleId: objectId('obstacleId'),
            value: requiredString('value')
          })
          .strict()
      )
      .optional(),
    penaltyResults: z
      .array(
        z
          .object({
            penaltyId: objectId('penaltyId'),
            selected: z.coerce.boolean()
          })
          .strict()
      )
      .optional()
  })
  .strict();

export const updateBattleLiveStateSchema = z
  .object({
    activeTournamentPlayerId: nullableObjectId('activeTournamentPlayerId')
  })
  .strict();

export const updateJudgeSessionResultSchema = z
  .object({
    liveStateVersion: z.coerce.number().int().min(0),
    obstacleResults: z
      .array(
        z
          .object({
            obstacleId: objectId('obstacleId'),
            value: requiredString('value')
          })
          .strict()
      )
      .default([])
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: requiredString('password')
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: requiredString('currentPassword'),
    newPassword: password
  })
  .strict();

export const createUserSchema = z
  .object({
    email,
    name: requiredString('name'),
    role: userRole.default('JUDGE'),
    temporaryPassword: password
  })
  .strict();

export const updateUserSchema = z
  .object({
    email: email.optional(),
    name: requiredString('name').optional(),
    role: userRole.optional(),
    active: z.coerce.boolean().optional()
  })
  .strict();

export const resetUserPasswordSchema = z
  .object({
    temporaryPassword: password
  })
  .strict();
