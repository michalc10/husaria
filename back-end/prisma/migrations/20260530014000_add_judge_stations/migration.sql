CREATE TABLE "judge_stations" (
  "id" TEXT NOT NULL,
  "tournament_id" TEXT NOT NULL,
  "battle_id" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(3),

  CONSTRAINT "judge_stations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "battle_live_states" (
  "battle_id" TEXT NOT NULL,
  "active_tournament_player_id" TEXT,
  "version" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "battle_live_states_pkey" PRIMARY KEY ("battle_id")
);

CREATE TABLE "score_change_logs" (
  "id" TEXT NOT NULL,
  "battle_id" TEXT NOT NULL,
  "tournament_player_id" TEXT NOT NULL,
  "judge_station_id" TEXT,
  "source" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "score_change_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "judge_stations_token_hash_key" ON "judge_stations"("token_hash");
CREATE UNIQUE INDEX "judge_stations_battle_id_category_id_key" ON "judge_stations"("battle_id", "category_id");
CREATE INDEX "judge_stations_tournament_id_idx" ON "judge_stations"("tournament_id");
CREATE INDEX "judge_stations_battle_id_idx" ON "judge_stations"("battle_id");
CREATE INDEX "judge_stations_category_id_idx" ON "judge_stations"("category_id");
CREATE INDEX "battle_live_states_active_tournament_player_id_idx" ON "battle_live_states"("active_tournament_player_id");
CREATE INDEX "score_change_logs_battle_id_idx" ON "score_change_logs"("battle_id");
CREATE INDEX "score_change_logs_tournament_player_id_idx" ON "score_change_logs"("tournament_player_id");
CREATE INDEX "score_change_logs_judge_station_id_idx" ON "score_change_logs"("judge_station_id");

ALTER TABLE "judge_stations"
  ADD CONSTRAINT "judge_stations_tournament_id_fkey"
  FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "judge_stations"
  ADD CONSTRAINT "judge_stations_battle_id_fkey"
  FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "judge_stations"
  ADD CONSTRAINT "judge_stations_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "battle_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "battle_live_states"
  ADD CONSTRAINT "battle_live_states_battle_id_fkey"
  FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "battle_live_states"
  ADD CONSTRAINT "battle_live_states_active_tournament_player_id_fkey"
  FOREIGN KEY ("active_tournament_player_id") REFERENCES "tournament_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "score_change_logs"
  ADD CONSTRAINT "score_change_logs_battle_id_fkey"
  FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "score_change_logs"
  ADD CONSTRAINT "score_change_logs_tournament_player_id_fkey"
  FOREIGN KEY ("tournament_player_id") REFERENCES "tournament_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "score_change_logs"
  ADD CONSTRAINT "score_change_logs_judge_station_id_fkey"
  FOREIGN KEY ("judge_station_id") REFERENCES "judge_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
