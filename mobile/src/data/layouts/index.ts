import { getRegExp } from 'korean-regexp';

import { rawLayouts } from './raw';

export type Seat = {
  row: string;
  number: number;
  x: number;
  y: number;
  zone: string | null;
  kind: string | null;
  aisleLeft: boolean;
  aisleRight: boolean;
};

export type Layout = {
  id: string;
  chain: string;
  theater: string;
  screen: string;
  screenNo: string;
  grid: { width: number; height: number };
  seatCount: number;
  seats: Seat[];
};

export type Theater = { name: string; screens: Layout[] };

const layouts: Layout[] = Object.entries(rawLayouts).map(([id, raw]) => ({ ...(raw as Omit<Layout, 'id'>), id }));

const byId = new Map(layouts.map((layout) => [layout.id, layout]));

export function getLayout(id: string): Layout | undefined {
  return byId.get(id);
}

export function listTheaters(): Theater[] {
  const theaters = new Map<string, Layout[]>();
  for (const layout of layouts) {
    theaters.set(layout.theater, [...(theaters.get(layout.theater) ?? []), layout]);
  }
  return [...theaters]
    .map(([name, screens]) => ({
      name,
      screens: screens.sort((a, b) => a.screenNo.localeCompare(b.screenNo)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export type Chain = { name: string; theaters: Theater[]; screenCount: number };

const ALIASES: [string, string][] = [
  ['아이맥스', 'imax'],
  ['돌비', 'dolby'],
  ['포디엑스', '4dx'],
  ['스크린엑스', 'screenx'],
  ['씨지브이', 'cgv'],
  ['메박', '메가박스'],
];

function queryPatterns(query: string) {
  return query
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ALIASES.find(([from]) => word === from)?.[1] ?? word)
    .map((word) => getRegExp(word, { initialSearch: true, ignoreSpace: true, ignoreCase: true }));
}

export function searchTheaters(query: string): Theater[] {
  const patterns = queryPatterns(query);
  if (patterns.length === 0) return listTheaters();
  return listTheaters()
    .map((theater) => {
      const theaterText = `${theater.screens[0].chain} ${theater.name}`;
      if (patterns.every((p) => p.test(theaterText))) return theater;
      const screens = theater.screens.filter((screen) => patterns.every((p) => p.test(`${theaterText} ${screen.screen}`)));
      return { ...theater, screens };
    })
    .filter((theater) => theater.screens.length > 0);
}

export function listChains(query = ''): Chain[] {
  const chains = new Map<string, Theater[]>();
  for (const theater of searchTheaters(query)) {
    const chain = theater.screens[0].chain;
    chains.set(chain, [...(chains.get(chain) ?? []), theater]);
  }
  return [...chains].map(([name, theaters]) => ({
    name,
    theaters,
    screenCount: theaters.reduce((sum, t) => sum + t.screens.length, 0),
  }));
}

export function seatKey(row: string, number: number) {
  return `${row}-${number}`;
}
