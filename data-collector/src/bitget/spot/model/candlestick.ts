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
export type Candlestick = string[];
export type Granularity = 
  | "1min" | "3min" | "5min" | "15min" | "30min"
  | "1h" | "4h" | "6h" | "12h"
  | "1day" | "3day" | "1week" | "1M"
  | "6Hutc" | "12Hutc" | "1Dutc" | "3Dutc" | "1Wutc" | "1Mutc";
