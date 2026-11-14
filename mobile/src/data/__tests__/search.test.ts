import { expect, test } from '@jest/globals';

import { listTheaters, searchTheaters } from '@/data/layouts';

function names(query: string) {
  return searchTheaters(query).map((theater) => theater.name);
}

test('an empty search lists every theater', () => {
  expect(searchTheaters('  ')).toHaveLength(listTheaters().length);
});

test('a theater name finds that theater with all its screens', () => {
  const [sillim] = searchTheaters('신림');
  expect(names('신림')).toEqual(['롯데시네마 신림']);
  expect(sillim.screens).toHaveLength(listTheaters().find((t) => t.name === '롯데시네마 신림')!.screens.length);
});

test('a screen type finds only those screens, ignoring case and Korean spelling', () => {
  const imax = searchTheaters('imax');
  expect(imax.length).toBeGreaterThan(1);
  expect(imax.every((theater) => theater.screens.every((screen) => /imax/i.test(screen.screen)))).toBe(true);
  expect(searchTheaters('아이맥스')).toEqual(imax);
});

test('words narrow each other down', () => {
  const result = searchTheaters('왕십리 imax');
  expect(result.map((t) => t.name)).toEqual(['CGV 왕십리']);
  expect(result[0].screens.map((s) => s.screen)).toEqual(['IMAX관']);
});

test('a search with no match returns nothing', () => {
  expect(searchTheaters('부산')).toEqual([]);
});

test.each(['노우', '노워', 'ㄴㅇ'])('"%s", typed on the way to 노원, already finds it', (query) => {
  expect(names(query)).toContain('롯데시네마 노원');
});
