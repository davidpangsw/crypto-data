import { Pool, PoolConfig } from "pg";

export function connect(config: PoolConfig) {
  const db = new Pool(config);
  return db;
}