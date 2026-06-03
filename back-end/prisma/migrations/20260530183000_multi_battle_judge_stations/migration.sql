CREATE TABLE "judge_station_assignments" (
  "station_id" TEXT NOT NULL,
  "battle_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "judge_station_assignments_pkey" PRIMARY KEY ("station_id", "battle_id")
);

CREATE TABLE "tournament_live_states" (
  "tournament_id" TEXT NOT NULL,
  "active_tournament_player_id" TEXT,
  "version" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tournament_live_states_pkey" PRIMARY KEY ("tournament_id")
);

INSERT INTO "judge_station_assignments" ("station_id", "battle_id")
SELECT "id", "battle_id"
FROM "judge_stations"
ON CONFLICT DO NOTHING;

UPDATE "judge_stations"
SET "revoked_at" = COALESCE("revoked_at", CURRENT_TIMESTAMP);

CREATE INDEX "judge_station_assignments_battle_id_idx" ON "judge_station_assignments"("battle_id");
CREATE INDEX "tournament_live_states_active_tournament_player_id_idx" ON "tournament_live_states"("active_tournament_player_id");

ALTER TABLE "judge_station_assignments"
  ADD CONSTRAINT "judge_station_assignments_station_id_fkey"
  FOREIGN KEY ("station_id") REFERENCES "judge_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "judge_station_assignments"
  ADD CONSTRAINT "judge_station_assignments_battle_id_fkey"
  FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tournament_live_states"
  ADD CONSTRAINT "tournament_live_states_tournament_id_fkey"
  FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tournament_live_states"
  ADD CONSTRAINT "tournament_live_states_active_tournament_player_id_fkey"
  FOREIGN KEY ("active_tournament_player_id") REFERENCES "tournament_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "judge_stations" DROP CONSTRAINT "judge_stations_battle_id_fkey";
ALTER TABLE "judge_stations" DROP CONSTRAINT "judge_stations_category_id_fkey";
DROP INDEX "judge_stations_battle_id_category_id_key";
DROP INDEX "judge_stations_battle_id_idx";
DROP INDEX "judge_stations_category_id_idx";

ALTER TABLE "judge_stations"
  DROP COLUMN "battle_id",
  DROP COLUMN "category_id";
