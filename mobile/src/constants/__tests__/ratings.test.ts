import { expect, test } from '@jest/globals';

import { seatVerdict } from '@/constants/ratings';

test('a seat is good with at most one small miss, okay with two, and bad with three or more', () => {
  expect(seatVerdict({ height: 3, side: 3, discomforts: [] })).toBe('good');
  expect(seatVerdict({ height: 3, side: 3, discomforts: ['legroom'] })).toBe('good');
  expect(seatVerdict({ height: 2, side: 3, discomforts: [] })).toBe('good');
  expect(seatVerdict({ height: 2, side: 4, discomforts: [] })).toBe('okay');
  expect(seatVerdict({ height: 1, side: 3, discomforts: [] })).toBe('okay');
  expect(seatVerdict({ height: 1, side: 3, discomforts: ['chair'] })).toBe('bad');
});
