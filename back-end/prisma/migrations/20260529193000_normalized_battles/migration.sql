CREATE TABLE IF NOT EXISTS battles (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  legacy_key TEXT,
  UNIQUE (tournament_id, sort_order)
);

CREATE TABLE IF NOT EXISTS battle_categories (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  UNIQUE (battle_id, sort_order)
);

CREATE TABLE IF NOT EXISTS battle_obstacles (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES battle_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  input_type TEXT NOT NULL DEFAULT 'toggle',
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  score_raw TEXT NOT NULL DEFAULT '',
  score_options JSONB,
  UNIQUE (category_id, sort_order)
);

CREATE TABLE IF NOT EXISTS battle_penalties (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  UNIQUE (battle_id, sort_order)
);

CREATE TABLE IF NOT EXISTS battle_results (
  id TEXT PRIMARY KEY,
  tournament_player_id TEXT NOT NULL REFERENCES tournament_players(id) ON DELETE CASCADE,
  battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  extra_points DOUBLE PRECISION NOT NULL DEFAULT 0,
  time DOUBLE PRECISION NOT NULL DEFAULT 0,
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  UNIQUE (tournament_player_id, battle_id)
);

CREATE TABLE IF NOT EXISTS obstacle_results (
  id TEXT PRIMARY KEY,
  battle_result_id TEXT NOT NULL REFERENCES battle_results(id) ON DELETE CASCADE,
  obstacle_id TEXT NOT NULL REFERENCES battle_obstacles(id) ON DELETE CASCADE,
  value TEXT NOT NULL DEFAULT '0',
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  UNIQUE (battle_result_id, obstacle_id)
);

CREATE TABLE IF NOT EXISTS penalty_results (
  id TEXT PRIMARY KEY,
  battle_result_id TEXT NOT NULL REFERENCES battle_results(id) ON DELETE CASCADE,
  penalty_id TEXT NOT NULL REFERENCES battle_penalties(id) ON DELETE CASCADE,
  selected BOOLEAN NOT NULL DEFAULT FALSE,
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  UNIQUE (battle_result_id, penalty_id)
);

CREATE INDEX IF NOT EXISTS idx_battles_tournament_id ON battles(tournament_id);
CREATE INDEX IF NOT EXISTS idx_battle_categories_battle_id ON battle_categories(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_obstacles_category_id ON battle_obstacles(category_id);
CREATE INDEX IF NOT EXISTS idx_battle_penalties_battle_id ON battle_penalties(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_results_battle_id ON battle_results(battle_id);
CREATE INDEX IF NOT EXISTS idx_obstacle_results_obstacle_id ON obstacle_results(obstacle_id);
CREATE INDEX IF NOT EXISTS idx_penalty_results_penalty_id ON penalty_results(penalty_id);

