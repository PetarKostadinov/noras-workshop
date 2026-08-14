import { matchFaq, normalizeQuestion } from './faqMatcher';

test('normalizes case, punctuation, and repeated whitespace', () => {
  expect(normalizeQuestion('  HOW,   much is shipping?! ')).toBe('how much is shipping');
  expect(normalizeQuestion('  КОЛКО   струва ДОСТАВКАТА? ')).toBe('колко струва доставката');
});

test('matches an English shipping question phrased differently', () => {
  expect(matchFaq('How much does delivery cost?', 'en').match.id).toBe('shipping-cost');
});

test('matches a Bulgarian returns question', () => {
  expect(matchFaq('Мога ли да върна продукт?', 'bg').match.id).toBe('returns');
});

test('uses stable entry order to resolve equal scores', () => {
  expect(matchFaq('order', 'en').match.id).toBe('delivery-time');
});

test('returns related suggestions for a weak match', () => {
  const result = matchFaq('delivery', 'en');

  expect(result.match).toBeNull();
  expect(result.suggestions.map(({ id }) => id)).toEqual(
    expect.arrayContaining(['shipping-cost', 'delivery-time'])
  );
});

test('returns popular topics for an unrelated question', () => {
  const result = matchFaq('Do you sell bicycles?', 'en');

  expect(result.match).toBeNull();
  expect(result.suggestions.map(({ id }) => id)).toEqual([
    'shipping-cost',
    'delivery-time',
    'returns',
  ]);
});
