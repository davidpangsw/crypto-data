import { Pool } from "pg";

export interface DepthData {
  symbol: string;
  timestamp: number;
  bidPrices: string[];
  askPrices: string[];
  bidQuantities: string[];
  askQuantities: string[];
}

export class DepthDataRepository {
  private db: Pool;
  private schema: string;

  constructor(db: Pool, schema: string) {
    this.db = db;
    this.schema = schema; // Default schema is 'public'
  }

  async init(): Promise<void> {
    await this.db.query(`
      CREATE SCHEMA IF NOT EXISTS ${this.schema};  -- Ensure the schema exists
    `);

    // Create table with snake_case column names
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS ${this.schema}.depth_data (
        symbol TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        bid_prices NUMERIC[] NOT NULL,
        ask_prices NUMERIC[] NOT NULL,
        bid_quantities NUMERIC[] NOT NULL,
        ask_quantities NUMERIC[] NOT NULL,
        PRIMARY KEY (symbol, timestamp)
      )
    `);
  }

  async save(depthData: DepthData): Promise<void> {
    const { symbol, timestamp, bidPrices, bidQuantities, askPrices, askQuantities } = depthData;
    await this.db.query(
      `
      INSERT INTO ${this.schema}.depth_data (symbol, timestamp, bid_prices, ask_prices, bid_quantities, ask_quantities)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (symbol, timestamp) DO NOTHING
      `,
      [symbol, timestamp, bidPrices, askPrices, bidQuantities, askQuantities]  // Pass the arrays of strings
    );
  }
}
