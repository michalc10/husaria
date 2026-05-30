CREATE TABLE IF NOT EXISTS leagues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  horse TEXT NOT NULL,
  flag TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  city TEXT NOT NULL DEFAULT '',
  date TIMESTAMPTZ NOT NULL,
  battle_1 TEXT NOT NULL DEFAULT '',
  battle_2 TEXT NOT NULL DEFAULT '',
  battle_3 TEXT NOT NULL DEFAULT '',
  battle_4 TEXT NOT NULL DEFAULT '',
  battle_5 TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS tournament_players (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  player_name TEXT NOT NULL,
  horse TEXT NOT NULL,
  flag TEXT NOT NULL,

  battle_1_points TEXT NOT NULL DEFAULT '0',
  battle_1_extra_points NUMERIC NOT NULL DEFAULT 0,
  battle_1_time NUMERIC NOT NULL DEFAULT 0,
  battle_1_score NUMERIC NOT NULL DEFAULT 0,

  battle_2_points TEXT NOT NULL DEFAULT '0',
  battle_2_extra_points NUMERIC NOT NULL DEFAULT 0,
  battle_2_time NUMERIC NOT NULL DEFAULT 0,
  battle_2_score NUMERIC NOT NULL DEFAULT 0,

  battle_3_points TEXT NOT NULL DEFAULT '0',
  battle_3_extra_points NUMERIC NOT NULL DEFAULT 0,
  battle_3_time NUMERIC NOT NULL DEFAULT 0,
  battle_3_score NUMERIC NOT NULL DEFAULT 0,

  battle_4_points TEXT NOT NULL DEFAULT '0',
  battle_4_extra_points NUMERIC NOT NULL DEFAULT 0,
  battle_4_time NUMERIC NOT NULL DEFAULT 0,
  battle_4_score NUMERIC NOT NULL DEFAULT 0,

  battle_5_points TEXT NOT NULL DEFAULT '0',
  battle_5_extra_points NUMERIC NOT NULL DEFAULT 0,
  battle_5_time NUMERIC NOT NULL DEFAULT 0,
  battle_5_score NUMERIC NOT NULL DEFAULT 0,

  penalty NUMERIC NOT NULL DEFAULT 0,
  score NUMERIC NOT NULL DEFAULT 0,
  start_order INTEGER NOT NULL DEFAULT 0,

  UNIQUE (tournament_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_tournaments_league_id ON tournaments(league_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament_id ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_player_id ON tournament_players(player_id);

