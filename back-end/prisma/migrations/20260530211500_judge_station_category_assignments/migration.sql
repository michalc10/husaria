CREATE TABLE "judge_station_assignments_new" (
  "station_id" TEXT NOT NULL,
  "battle_id" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "judge_station_assignments_new_pkey" PRIMARY KEY ("station_id", "battle_id", "category_id")
);

INSERT INTO "judge_station_assignments_new" ("station_id", "battle_id", "category_id", "created_at")
SELECT assignment."station_id", assignment."battle_id", category."id", assignment."created_at"
FROM "judge_station_assignments" assignment
JOIN "battle_categories" category ON category."battle_id" = assignment."battle_id"
ON CONFLICT DO NOTHING;

DROP TABLE "judge_station_assignments";

ALTER TABLE "judge_station_assignments_new" RENAME TO "judge_station_assignments";
ALTER TABLE "judge_station_assignments" RENAME CONSTRAINT "judge_station_assignments_new_pkey" TO "judge_station_assignments_pkey";

CREATE INDEX "judge_station_assignments_battle_id_idx" ON "judge_station_assignments"("battle_id");
CREATE INDEX "judge_station_assignments_category_id_idx" ON "judge_station_assignments"("category_id");

ALTER TABLE "judge_station_assignments"
  ADD CONSTRAINT "judge_station_assignments_station_id_fkey"
  FOREIGN KEY ("station_id") REFERENCES "judge_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "judge_station_assignments"
  ADD CONSTRAINT "judge_station_assignments_battle_id_fkey"
  FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "judge_station_assignments"
  ADD CONSTRAINT "judge_station_assignments_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "battle_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
