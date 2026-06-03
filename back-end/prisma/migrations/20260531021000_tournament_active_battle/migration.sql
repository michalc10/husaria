ALTER TABLE "tournament_live_states"
ADD COLUMN "active_battle_id" TEXT;

CREATE INDEX "tournament_live_states_active_battle_id_idx"
ON "tournament_live_states"("active_battle_id");

ALTER TABLE "tournament_live_states"
ADD CONSTRAINT "tournament_live_states_active_battle_id_fkey"
FOREIGN KEY ("active_battle_id")
REFERENCES "battles"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
