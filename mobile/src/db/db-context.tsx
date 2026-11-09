import { createContext, use, type ReactNode } from 'react';

import type { Db } from './types';

const DbContext = createContext<Db | null>(null);

export function DbProvider({ db, children }: { db: Db; children: ReactNode }) {
  return <DbContext value={db}>{children}</DbContext>;
}

export function useDb(): Db {
  const db = use(DbContext);
  if (!db) {
    throw new Error('DbProvider is missing');
  }
  return db;
}
