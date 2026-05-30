ALTER TABLE players DROP CONSTRAINT IF EXISTS players_banner_id_fkey;
ALTER TABLE tournament_players DROP CONSTRAINT IF EXISTS tournament_players_banner_id_fkey;

ALTER TABLE players ALTER COLUMN banner_id DROP NOT NULL;
ALTER TABLE tournament_players ALTER COLUMN banner_id DROP NOT NULL;

ALTER TABLE players
  ADD CONSTRAINT players_banner_id_fkey
  FOREIGN KEY (banner_id) REFERENCES banners(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE tournament_players
  ADD CONSTRAINT tournament_players_banner_id_fkey
  FOREIGN KEY (banner_id) REFERENCES banners(id)
  ON DELETE SET NULL ON UPDATE CASCADE;
