import assert from 'assert';
import { parseBattleDefinition, scoreObstacleValue } from '../battles/battleParser';

const sample =
  'Szabla;/P1;Cięcie łozy:6/P2;Cięcie jabłka:6/P3 beczka;Niższy chód:10;Ominięcie przeszkody:25;Demontaż przeszkody:25/P4 skok;Zrzutka:5;Ominięcie przeszkody:25;Demontaż przeszkody:25/P5;Cięcie jabłka:6/Punkty karne;Utrata broni:5;Upadek jeźdźca:20;Upadek konia i jeźdźca:40';

const parsed = parseBattleDefinition(sample);

assert.equal(parsed.name, 'Szabla');
assert.equal(parsed.categories.length, 5);
assert.equal(parsed.penalties.length, 3);
assert.equal(parsed.legacyItems.length, 12);
assert.equal(parsed.categories[0].name, 'P1');
assert.equal(parsed.categories[0].obstacles[0].name, 'Cięcie łozy');
assert.equal(parsed.categories[0].obstacles[0].score, 6);
assert.equal(parsed.penalties[2].name, 'Upadek konia i jeźdźca');
assert.equal(parsed.penalties[2].score, 40);
assert.equal(scoreObstacleValue(parsed.categories[0].obstacles[0], '1'), 6);
assert.equal(scoreObstacleValue(parsed.categories[0].obstacles[0], '0'), 0);

const selectParsed = parseBattleDefinition('Pałasz;/P2;Pchnięcie klocka:10-0-6-8');
const selectObstacle = selectParsed.categories[0].obstacles[0];

assert.equal(selectObstacle.inputType, 'select');
assert.deepEqual(selectObstacle.scoreOptions, [
  { code: '0', label: '0', score: 10 },
  { code: '1', label: '1', score: 0 },
  { code: '2', label: '2', score: 6 },
  { code: '3', label: '3', score: 8 }
]);
assert.equal(scoreObstacleValue(selectObstacle, '3'), 8);

console.log('battleParser tests passed');
