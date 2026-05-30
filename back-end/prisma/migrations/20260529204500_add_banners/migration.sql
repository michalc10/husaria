CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT ''
);

CREATE UNIQUE INDEX IF NOT EXISTS banners_name_city_key ON banners(name, city);

WITH legacy_banner_names AS (
  SELECT DISTINCT COALESCE(NULLIF(BTRIM(flag), ''), 'Bez chorągwi') AS name FROM players
  UNION
  SELECT DISTINCT COALESCE(NULLIF(BTRIM(flag), ''), 'Bez chorągwi') AS name FROM tournament_players
  UNION
  SELECT 'Bez chorągwi' AS name
)
INSERT INTO banners (id, name, city)
SELECT SUBSTR(MD5('banner:' || name || ':'), 1, 24), name, ''
FROM legacy_banner_names
ON CONFLICT (name, city) DO NOTHING;

ALTER TABLE players ADD COLUMN IF NOT EXISTS banner_id TEXT;
ALTER TABLE tournament_players ADD COLUMN IF NOT EXISTS banner_id TEXT;

UPDATE players
SET banner_id = banners.id
FROM banners
WHERE banners.name = COALESCE(NULLIF(BTRIM(players.flag), ''), 'Bez chorągwi')
  AND banners.city = ''
  AND players.banner_id IS NULL;

UPDATE tournament_players
SET banner_id = banners.id
FROM banners
WHERE banners.name = COALESCE(NULLIF(BTRIM(tournament_players.flag), ''), 'Bez chorągwi')
  AND banners.city = ''
  AND tournament_players.banner_id IS NULL;

ALTER TABLE players ALTER COLUMN banner_id SET NOT NULL;
ALTER TABLE tournament_players ALTER COLUMN banner_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_banner_id_fkey') THEN
    ALTER TABLE players
      ADD CONSTRAINT players_banner_id_fkey
      FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_players_banner_id_fkey') THEN
    ALTER TABLE tournament_players
      ADD CONSTRAINT tournament_players_banner_id_fkey
      FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_players_banner_id ON players(banner_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_banner_id ON tournament_players(banner_id);
