import { FAQ_CONTENT } from './faqContent';

export function normalizeQuestion(value = '') {
  return value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreKeyword(question, keyword) {
  const normalizedKeyword = normalizeQuestion(keyword);
  if (question === normalizedKeyword) return 6;
  if (question.includes(normalizedKeyword)) return normalizedKeyword.includes(' ') ? 4 : 2;

  const questionWords = new Set(question.split(' '));
  const keywordWords = normalizedKeyword.split(' ').filter((word) => word.length > 2);
  const overlap = keywordWords.filter((word) => questionWords.has(word)).length;

  return overlap >= 2 ? 3 : overlap;
}

export function matchFaq(question, language = 'en') {
  const content = FAQ_CONTENT[language === 'bg' ? 'bg' : 'en'];
  const normalized = normalizeQuestion(question);
  const ranked = content.entries
    .map((entry, index) => ({
      entry,
      index,
      score: Math.max(...entry.keywords.map((keyword) => scoreKeyword(normalized, keyword))),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const best = ranked[0];

  if (normalized && best.score >= 2) {
    return { match: best.entry, suggestions: [] };
  }

  const related = ranked
    .filter(({ score }) => score > 0)
    .slice(0, 3)
    .map(({ entry }) => entry);
  const popular = content.popularIds.map((id) => content.entries.find((entry) => entry.id === id));

  return { match: null, suggestions: related.length ? related : popular };
}
