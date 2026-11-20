import { expect, test } from '@jest/globals';

import { getLayout, listTheaters } from '@/data/layouts';

const layouts = listTheaters().flatMap((theater) => theater.screens.map((screen) => getLayout(screen.id)!));

test.each(layouts.map((layout) => [`${layout.theater} ${layout.screen}`, layout] as const))(
  '%s fits in a seat-sized grid',
  (_, layout) => {
    expect(layout.grid.width).toBeLessThanOrEqual(60);
    expect(layout.grid.height).toBeLessThanOrEqual(30);
    expect(new Set(layout.seats.map((s) => `${s.x},${s.y}`)).size).toBe(layout.seats.length);
  },
);

test('every theater has a location', () => {
  expect(listTheaters().filter((t) => t.lat === null || t.lng === null).map((t) => t.name)).toEqual([]);
});
