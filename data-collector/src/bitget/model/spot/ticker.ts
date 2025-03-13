/**
 * Ticker (Market)
 */
export type SpotTickerData = SpotTickerDataItem[];
export interface SpotTickerDataItem {
  instId: string;
  lastPr: string;
  bidPr: string;
  askPr: string;
  bidSz: string;
  askSz: string;
  open24h: string;
  high24h: string;
  low24h: string;
  changeUtc24h: string, // 	Change at UTC+0, 0.01 means 1%.
  change24h: string;
  baseVolume: string;
  quoteVolume: string;
  openUtc: string;
  ts: number;
}
