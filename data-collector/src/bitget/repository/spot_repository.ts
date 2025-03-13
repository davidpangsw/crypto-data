import { Point } from "@influxdata/influxdb-client";
import { Repository } from "../../database/influx/repository";
import { ChannelUpdate, ChannelUpdateArgument } from "../model/update";
import { SpotTickerData, SpotTickerDataItem } from "../model/spot/ticker";
import logger from "../../utils/logger";

interface CandlestickMetaData {
  symbol: string;
  granularity: string;
}
// interface Candlestick {
//   timestamp: string;
//   open: string; high: string; low: string; close: string;
//   baseVolume: string; usdtVolume: string; quoteVolume: string;
// }
type Candlestick = string[]

export class SpotRepository extends Repository {
  async saveCandlesticks(meta: CandlestickMetaData, candlesticks: Candlestick[]) {
    const { symbol, granularity } = meta;
    for (const c of candlesticks) {
      const [timestamp, open, high, low, close, baseVolume, usdtVolume, quoteVolume] = c;
      // const data = { timestamp, open, high, low, close, baseVolume, usdtVolume, quoteVolume };
      // logger.info(JSON.stringify(data));
      const point = new Point('candlestick')
        .tag('symbol', symbol)
        .tag('granularity', granularity)
        .timestamp(timestamp);
      point.floatField('open', open);
      point.floatField('high', high);
      point.floatField('low', low);
      point.floatField('close', close);
      point.floatField('baseVolume', baseVolume);
      point.floatField('usdtVolume', usdtVolume);
      point.floatField('quoteVolume', quoteVolume);

      // logger.info(point)
      super.savePoint(point);
    }
  }
  async saveTickerSnapshot(update: ChannelUpdate) {
    const { action, arg, data } = update;
    for (const item of data as SpotTickerData) {
      // const {instId, ts, markPrice} = item as TickerDataItem;

      await this.saveTickerData(arg, item as SpotTickerDataItem);
    }
  }

  private async saveTickerData(arg: ChannelUpdateArgument, data: SpotTickerDataItem): Promise<void> {
    const { instId, instType, channel } = arg;
    const { lastPr, ts: timestamp } = data;

    // Create the point for InfluxDB
    const point = new Point('tickerData')
      .tag('instId', instId)
      // .tag('instType', instType)
      .tag('channel', channel)
      .timestamp(timestamp);
    // console.log(timestamp)

    // Add arrays of prices and quantities as fields
    // point.stringField('mark_price_str', markPrice);
    point.floatField('lastPr', lastPr);

    // Write data to InfluxDB
    // console.log(point)
    super.savePoint(point);
  }
}