export type BattleInputType = 'toggle' | 'select';

export type ScoreOption = {
  code: string;
  label: string;
  score: number;
};

export type ParsedObstacle = {
  name: string;
  order: number;
  inputType: BattleInputType;
  score: number;
  scoreRaw: string;
  scoreOptions?: ScoreOption[];
};

export type ParsedCategory = {
  name: string;
  order: number;
  obstacles: ParsedObstacle[];
};

export type ParsedPenalty = {
  name: string;
  order: number;
  score: number;
};

export type ParsedLegacyItem =
  | { kind: 'obstacle'; categoryIndex: number; obstacleIndex: number }
  | { kind: 'penalty'; penaltyIndex: number };

export type ParsedBattle = {
  name: string;
  categories: ParsedCategory[];
  penalties: ParsedPenalty[];
  legacyItems: ParsedLegacyItem[];
};

const emptyBattleName = 'Nowa konkurencja';

const normalizePart = (value: string) => value.trim().replace(/\s+/g, ' ');

const splitOnFirst = (value: string, separator: string): [string, string] => {
  const index = value.indexOf(separator);
  return index === -1 ? [value, ''] : [value.slice(0, index), value.slice(index + separator.length)];
};

const parseNumber = (value: string | undefined): number => {
  const result = Number(String(value ?? '').replace(',', '.').trim());
  return Number.isFinite(result) ? result : 0;
};

export const parseScore = (rawScore: string): Pick<ParsedObstacle, 'inputType' | 'score' | 'scoreRaw' | 'scoreOptions'> => {
  const scoreRaw = normalizePart(rawScore);

  if (scoreRaw.includes('-')) {
    const options = scoreRaw.split('-').map((score, index) => ({
      code: String(index),
      label: String(index),
      score: parseNumber(score)
    }));

    return {
      inputType: 'select',
      score: 0,
      scoreRaw,
      scoreOptions: options
    };
  }

  return {
    inputType: 'toggle',
    score: parseNumber(scoreRaw),
    scoreRaw
  };
};

export const parseBattleDefinition = (battleString: string): ParsedBattle => {
  if (!battleString?.trim()) {
    return { name: emptyBattleName, categories: [], penalties: [], legacyItems: [] };
  }

  const parts = battleString
    .replace(/;{2,}/g, ';')
    .replace(/\/{2,}/g, '/')
    .split('/')
    .map(normalizePart)
    .filter(Boolean);
  const [rawBattleName = emptyBattleName, ...rawSections] = parts;
  const battleName = normalizePart(splitOnFirst(rawBattleName, ';')[0]) || emptyBattleName;
  const categories: ParsedCategory[] = [];
  const penalties: ParsedPenalty[] = [];
  const legacyItems: ParsedLegacyItem[] = [];

  rawSections.forEach((section) => {
    const [rawCategoryName, ...rawItems] = section
      .split(';')
      .map(normalizePart)
      .filter(Boolean);
    const categoryName = rawCategoryName || 'Kategoria';
    const isPenaltySection = categoryName.toLocaleLowerCase('pl-PL') === 'punkty karne';

    if (isPenaltySection) {
      rawItems.forEach((rawItem) => {
        const [name, score] = splitOnFirst(rawItem, ':');
        const penaltyIndex = penalties.length;
        penalties.push({
          name: normalizePart(name) || 'Kara',
          order: penaltyIndex + 1,
          score: parseNumber(score)
        });
        legacyItems.push({ kind: 'penalty', penaltyIndex });
      });
      return;
    }

    const categoryIndex = categories.length;
    const obstacles: ParsedObstacle[] = rawItems.map((rawItem, obstacleIndex) => {
      const [name, score] = splitOnFirst(rawItem, ':');
      const scoreDefinition = parseScore(score);
      legacyItems.push({ kind: 'obstacle', categoryIndex, obstacleIndex });

      return {
        name: normalizePart(name) || 'Przeszkoda',
        order: obstacleIndex + 1,
        ...scoreDefinition
      };
    });

    categories.push({
      name: categoryName,
      order: categoryIndex + 1,
      obstacles
    });
  });

  return { name: battleName, categories, penalties, legacyItems };
};

export const scoreObstacleValue = (obstacle: Pick<ParsedObstacle, 'inputType' | 'score' | 'scoreOptions'>, value: string) => {
  if (obstacle.inputType === 'select') {
    return obstacle.scoreOptions?.find((option) => option.code === value)?.score || 0;
  }

  return value === '1' ? obstacle.score : 0;
};

