/**
 * Ticker (Market)
 */
export type FutureTickerData = FutureTickerDataItem[];
export interface FutureTickerDataItem {
  instId: string;
  lastPr: string;
  bidPr: string;
  askPr: string;
  bidSz: string;
  askSz: string;
  open24h: string;
  high24h: string;
  low24h: string;
  change24h: string;
  fundingRate: string;
  nextFundingTime: number;
  markPrice: string;
  indexPrice: string;
  holdingAmount: string;
  baseVolume: string;
  quoteVolume: string;
  openUtc: string;
  symbolType: number;
  symbol: string;
  deliveryPrice: string;
  ts: number;
}
