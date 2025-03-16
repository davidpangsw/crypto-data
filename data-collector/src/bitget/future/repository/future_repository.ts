import { Point } from "@influxdata/influxdb-client";
import logger from "@/utils/logger";
import { Repository } from '@/database/influx/repository';
import { FutureDepthData, FutureDepthDataItem } from "../model/depth";
import { ChannelUpdate, ChannelUpdateArgument } from "../../utils/ws/update";
import { FutureTickerData, FutureTickerDataItem } from "../model/ticker";
import { Granularity } from "../model/candlestick";

interface CandlestickMetaData {
  symbol: string;
  granularity: Granularity;
}
// interface Candlestick {
//   timestamp: string;
//   entry: string; high: string; low: string; exit: string;
//   baseVolume: string; quoteVolume: string;
// }
type Candlestick = string[]
export class FutureRepository extends Repository {
  async saveCandlesticks(meta: CandlestickMetaData, candlesticks: Candlestick[]) {
    const { symbol, granularity } = meta;
    for (const c of candlesticks) {
      const [timestamp, entry, high, low, exit, baseVolume, quoteVolume] = c;
      // const data = { timestamp, open, high, low, close, baseVolume, usdtVolume, quoteVolume };
      // logger.info(JSON.stringify(data));
      const point = new Point('candlestick')
        .tag('symbol', symbol)
        .tag('granularity', granularity)
        .timestamp(timestamp);
      point.floatField('entry', entry);
      point.floatField('high', high);
      point.floatField('low', low);
      point.floatField('exit', exit);
      point.floatField('baseVolume', baseVolume);
      point.floatField('quoteVolume', quoteVolume);

      // logger.info(point)
      super.savePoint(point);
    }
  }
  saveMarkPriceCandlesticks(meta: CandlestickMetaData, candlesticks: Candlestick[]) {
    const { symbol, granularity } = meta;
    for (const c of candlesticks) {
      const [timestamp, entry, high, low, exit, baseVolume, quoteVolume] = c;
      // const data = { timestamp, open, high, low, close, baseVolume, usdtVolume, quoteVolume };
      // logger.info(JSON.stringify(data));
      const point = new Point('mark_price_candlestick')
        .tag('symbol', symbol)
        .tag('granularity', granularity)
        .timestamp(timestamp);
      point.floatField('entry', entry);
      point.floatField('high', high);
      point.floatField('low', low);
      point.floatField('exit', exit);
      point.floatField('baseVolume', baseVolume);
      point.floatField('quoteVolume', quoteVolume);

      // logger.info(point)
      super.savePoint(point);
    }
  }
  public async saveFundingRate(data: { symbol: string; fundingRate: string; fundingTime: string; }) {
    const { symbol, fundingRate, fundingTime: timestamp } = data;
    const point = new Point('fundingRate')
      .tag('symbol', symbol)
      // .tag('instType', instType)
      // .tag('channel', channel)
      .timestamp(timestamp);

    point.floatField('fundingRate', fundingRate);
    super.savePoint(point);
  }
  public async saveDepthUpdate(update: ChannelUpdate) {
    const { data } = update;
    // only for whole book subscription
    // data.length must be 1?
    for (const item of data as FutureDepthData) {
      const { bids, asks, checksum, ts } = item as FutureDepthDataItem;
      // logger.info(ts, bids.length, asks.length);
      logger.warn("Unhandled book push", item);
    }
  }

  public async saveDepthSnapshot(update: ChannelUpdate) {
    const { arg, data } = update;
    for (const item of data as FutureDepthData) {
      // logger.debug("Save depth snapshot", item.ts)
      // Todo: checksum
      await this.saveDepthData(arg, item);
    }
  }

  public async saveTickerSnapshot(update: ChannelUpdate) {
    const { action, arg, data } = update;
    for (const item of data as FutureTickerData) {
      // const {instId, ts, markPrice} = item as TickerDataItem;

      await this.saveTickerData(arg, item);
    }
  }

  private async saveDepthData(arg: ChannelUpdateArgument, item: FutureDepthDataItem): Promise<void> {
    const { instId, instType, channel } = arg;
    const { bids, asks, ts: timestamp } = item;
    // logger.info(ts);
    // Todo: checksum

    // Extract bid prices and quantities
    const { bidPrices, bidQuantities } = bids.reduce(
      (acc, [price, quantity]) => {
        acc.bidPrices.push(price);
        acc.bidQuantities.push(quantity);
        return acc;
      },
      { bidPrices: [] as string[], bidQuantities: [] as string[] }
    );
    // Extract ask prices and quantities
    const { askPrices, askQuantities } = asks.reduce(
      (acc, [price, quantity]) => {
        acc.askPrices.push(price);
        acc.askQuantities.push(quantity);
        return acc;
      },
      { askPrices: [] as string[], askQuantities: [] as string[] }
    );

    // Create the point for InfluxDB
    const point = new Point('depthData')
      .tag('instId', instId)
      // .tag('instType', instType)
      .tag('channel', channel)
      .timestamp(timestamp);
    // logger.info(timestamp)

    // Add arrays of prices and quantities as fields
    point.stringField('bidPrices', JSON.stringify(bidPrices));
    point.stringField('askPrices', JSON.stringify(askPrices));
    point.stringField('bidQuantities', JSON.stringify(bidQuantities));
    point.stringField('askQuantities', JSON.stringify(askQuantities));

    // Write data to InfluxDB
    // logger.info(point)
    super.savePoint(point);
  }
  private async saveTickerData(arg: ChannelUpdateArgument, data: FutureTickerDataItem): Promise<void> {
    const { instId, instType, channel } = arg;
    const { lastPr, fundingRate, nextFundingTime, markPrice, ts: timestamp } = data;

    // Create the point for InfluxDB
    const point = new Point('tickerData')
      .tag('instId', instId)
      // .tag('instType', instType)
      .tag('channel', channel)
      .timestamp(timestamp);
    // logger.info(timestamp)

    // Add arrays of prices and quantities as fields
    // point.stringField('mark_price_str', markPrice);
    point.floatField('lastPr', lastPr);
    point.floatField('fundingRate', fundingRate);
    point.intField('nextFundingTime', nextFundingTime);
    point.floatField('markPrice', markPrice);

    // Write data to InfluxDB
    // logger.info(point)
    super.savePoint(point);
  }
}