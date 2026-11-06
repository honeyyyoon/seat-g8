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
  return [...theaters].map(([name, screens]) => ({
    name,
    screens: screens.sort((a, b) => a.screenNo.localeCompare(b.screenNo)),
  }));
}

export type Chain = { name: string; theaters: Theater[]; screenCount: number };

export function listChains(): Chain[] {
  const chains = new Map<string, Theater[]>();
  for (const theater of listTheaters()) {
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
