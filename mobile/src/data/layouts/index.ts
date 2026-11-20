import { getRegExp } from 'korean-regexp';

import theaterList from '../theaters.json';
import meta from './meta.json';
import { loadLayout } from './raw';

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

export type ScreenInfo = {
  id: string;
  chain: string;
  theater: string;
  screen: string;
  screenNo: string;
  grid: { width: number; height: number };
  seatCount: number;
};

export type Layout = ScreenInfo & { seats: Seat[] };

export type Theater = {
  id: string;
  name: string;
  chain: string;
  lat: number | null;
  lng: number | null;
  screens: ScreenInfo[];
};

type MetaRow = Omit<ScreenInfo, 'id'> & { siteNo: string };

const screens: (ScreenInfo & { theaterId: string })[] = Object.entries(meta as Record<string, MetaRow>).map(
  ([id, { siteNo, ...row }]) => ({ ...row, id, theaterId: id.split('-').slice(0, 2).join('-') }),
);

const byId = new Map(screens.map((screen) => [screen.id, screen]));
const places = new Map(theaterList.map((t) => [t.id, t]));
const loaded = new Map<string, Layout>();

export function getScreen(id: string): ScreenInfo | undefined {
  return byId.get(id);
}

export function getLayout(id: string): Layout | undefined {
  const info = byId.get(id);
  if (!info) return undefined;
  let layout = loaded.get(id);
  if (!layout) {
    const raw = loadLayout[id]() as { seats: Seat[] };
    layout = { ...info, seats: raw.seats };
    loaded.set(id, layout);
  }
  return layout;
}

const theaters: Theater[] = (() => {
  const groups = new Map<string, (ScreenInfo & { theaterId: string })[]>();
  for (const screen of screens) {
    groups.set(screen.theaterId, [...(groups.get(screen.theaterId) ?? []), screen]);
  }
  return [...groups]
    .map(([id, list]) => {
      const place = places.get(id);
      return {
        id,
        name: list[0].theater,
        chain: list[0].chain,
        lat: place?.lat ?? null,
        lng: place?.lng ?? null,
        screens: list.sort((a, b) => a.screenNo.localeCompare(b.screenNo)),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
})();

export function listTheaters(): Theater[] {
  return theaters;
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
      const theaterText = `${theater.chain} ${theater.name}`;
      if (patterns.every((p) => p.test(theaterText))) return theater;
      const matched = theater.screens.filter((screen) => patterns.every((p) => p.test(`${theaterText} ${screen.screen}`)));
      return { ...theater, screens: matched };
    })
    .filter((theater) => theater.screens.length > 0);
}

export function listChains(query = ''): Chain[] {
  const chains = new Map<string, Theater[]>();
  for (const theater of searchTheaters(query)) {
    chains.set(theater.chain, [...(chains.get(theater.chain) ?? []), theater]);
  }
  return [...chains].map(([name, list]) => ({
    name,
    theaters: list,
    screenCount: list.reduce((sum, t) => sum + t.screens.length, 0),
  }));
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function seatKey(row: string, number: number) {
  return `${row}-${number}`;
}
