
import { api } from "../../utils/api/base";

/**
 * index[0]	String	System timestamp, Unix millisecond timestamp, e.g. 1690196141868
 * index[1]	String	Opening price
 * index[2]	String	Highest price
 * index[3]	String	Lowest price
 * index[4]	String	Closing price
 * index[5]	String	Trading volume in base currency, e.g. "BTC" in the "BTCUSDT" pair.
 * index[6]	String	Trading volume in USDT
 * index[7]	String	Trading volume in quote currency, e.g. "USDT" in the "BTCUSDT" pair.
 */
export type HistoricalCandlestick = string[];
export const getHistoricalCandlestick = api<
  {
    symbol: string,
    granularity: string,
    endTime: string,
    limit?: string,
  },
  HistoricalCandlestick[]
>(
  'GET', '/api/v2/spot/market/history-candles'
);