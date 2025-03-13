import { InstType } from "../../model/instrument";
import { api } from "../base";

/**
 * index[0]	String	Milliseconds format of timestamp Unix, e.g. 1597026383085
 * index[1]	String	Entry price
 * index[2]	String	Highest price
 * index[3]	String	Lowest price
 * index[4]	String	Exit price(Only include the finished K line data)
 * index[5]	String	Trading volume of the base coin
 * index[6]	String	Trading volume of quote currency
 */
export const getHistoricalCandlestick = api<
  {
    symbol: string,
    productType: InstType,
    granularity: string,
    startTime?: string, endTime?: string,
    limit?: string,
  },
  string[][]
>(
  'GET', '/api/v2/mix/market/history-candles'
)
export const getHistoricalFundingRate = api<
  {
    symbol: string,
    productType: string,
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

/**
 * index[0]	String	Milliseconds format of timestamp Unix, e.g. 1597026383085
 * index[1]	String	Entry price
 * index[2]	String	Highest price
 * index[3]	String	Lowest price
 * index[4]	String	Exit price(Only include the finished K line data)
 * index[5]	String	Trading volume of the base coin
 * index[6]	String	Trading volume of quote currency
 */
export type HistoricalMarkPriceCandlestick = string[];
export const getHistoricalMarkPriceCandlestick = api<
  {
    symbol: string,
    productType: InstType,
    granularity: string,
    startTime?: string, endTime?: string,
    limit?: string,
  },
  HistoricalMarkPriceCandlestick[]
>(
  'GET', '/api/v2/mix/market/history-mark-candles',
);