ALTER TABLE "tournaments"
ADD COLUMN "counts_in_league_standings" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "idx_tournaments_counts_in_league_standings"
ON "tournaments"("counts_in_league_standings");
