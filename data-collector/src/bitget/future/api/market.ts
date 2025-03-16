import { api } from "../../utils/api/base";
import { Candlestick, Granularity } from "../model/candlestick";
import { ProductType } from "../model/product_type";


export type HistoricalCandlestick = Candlestick;
export const getHistoricalCandlestick = api<
  {
    symbol: string,
    productType: ProductType,
    granularity: Granularity,
    startTime?: string, endTime?: string,
    limit?: string,
  },
  HistoricalCandlestick[]
>(
  'GET', '/api/v2/mix/market/history-candles'
)
export const getHistoricalFundingRate = api<
  {
    symbol: string,
    productType: ProductType,
    pageSize?: string, pageNo?: string
  },
  {
    symbol: string,
    fundingRate: string,
    fundingTime: string,
  }[]
>(
  'GET', '/api/v2/mix/market/history-fund-rate',
);

export type HistoricalMarkPriceCandlestick = Candlestick;
export const getHistoricalMarkPriceCandlestick = api<
  {
    symbol: string,
    productType: ProductType,
    granularity: Granularity,
    startTime?: string, endTime?: string,
    limit?: string,
  },
  HistoricalMarkPriceCandlestick[]
>(
  'GET', '/api/v2/mix/market/history-mark-candles',
);