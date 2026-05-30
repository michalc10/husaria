CREATE TYPE "TournamentStatus" AS ENUM ('PLANNING', 'LIVE', 'FINISHED');

ALTER TABLE "tournaments"
  ADD COLUMN "status" "TournamentStatus" NOT NULL DEFAULT 'PLANNING';
