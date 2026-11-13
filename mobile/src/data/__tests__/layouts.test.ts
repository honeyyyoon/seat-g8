import { expect, test } from '@jest/globals';

import { listTheaters } from '@/data/layouts';

const layouts = listTheaters().flatMap((theater) => theater.screens);

test.each(layouts.map((layout) => [`${layout.theater} ${layout.screen}`, layout] as const))(
  '%s fits in a seat-sized grid',
  (_, layout) => {
    expect(layout.grid.width).toBeLessThanOrEqual(60);
    expect(layout.grid.height).toBeLessThanOrEqual(30);
    expect(new Set(layout.seats.map((s) => `${s.x},${s.y}`)).size).toBe(layout.seats.length);
  },
);
