export type BindValue = string | number | null;

export type Db = {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: BindValue[]): Promise<unknown>;
  getAllAsync<T>(source: string, params: BindValue[]): Promise<T[]>;
  getFirstAsync<T>(source: string, params: BindValue[]): Promise<T | null>;
};
