ALTER TABLE "tournaments"
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "tournament_players"
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "battles"
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "battle_results"
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "client_mutations" (
  "id" TEXT NOT NULL,
  "client_mutation_id" TEXT NOT NULL,
  "device_id" TEXT NOT NULL DEFAULT '',
  "user_id" TEXT,
  "judge_station_id" TEXT,
  "type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'APPLIED',
  "payload" JSONB NOT NULL,
  "result" JSONB,
  "conflict" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3),
  CONSTRAINT "client_mutations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_mutations_client_mutation_id_key" ON "client_mutations"("client_mutation_id");
CREATE INDEX "client_mutations_device_id_idx" ON "client_mutations"("device_id");
CREATE INDEX "client_mutations_user_id_idx" ON "client_mutations"("user_id");
CREATE INDEX "client_mutations_judge_station_id_idx" ON "client_mutations"("judge_station_id");
CREATE INDEX "client_mutations_status_idx" ON "client_mutations"("status");
