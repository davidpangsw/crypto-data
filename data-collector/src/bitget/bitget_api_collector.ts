import { InfluxDB } from "@influxdata/influxdb-client";
import { FutureRepository } from "./repository/future_repository";
import { SpotRepository } from "./repository/spot_repository";
import logger from "../utils/logger";
import { ApiClient } from "../utils/api_client";
import { future, spot } from "./api/facade";
import { sleep } from "../utils/async";

export class BitgetApiCollector {
  private spotRepo: SpotRepository;
  private futureRepo: FutureRepository;
  private client: ApiClient;
  private symbols: string[] = [];

  constructor(db: InfluxDB, bucketPrefix: string, org: string) {
    this.client = new ApiClient();
    this.spotRepo = new SpotRepository(db, `${bucketPrefix}_spot`, org);
    this.futureRepo = new FutureRepository(db, `${bucketPrefix}_future`, org);
  }

  public addSymbols(symbols: string[]) {
    this.symbols.push(...symbols);
  }

  public async start() {
    // const granularity = '15m';
    const sleepMs = 15 * 60 * 1000;
    await this.spotRepo.init();
    await this.futureRepo.init();

    if (this.symbols.length == 0) {
      logger.warn("No symbols assigned");
      return;
    }
    while (true) {

      for (const symbol of this.symbols) {
        this.collectFutureCandlestick(symbol, "15m");
        this.collectFutureMarkPriceCandlestick(symbol, "15m");
        this.collectSpotCandlestick(symbol, "15min");
        this.collectFundingRate(symbol);
      }
      await sleep(sleepMs);
    }
  }

  private async collectFutureCandlestick(symbol: string, granularity: string) {
    // update future candlesticks
    this.futureRepo.saveCandlesticks(
      { symbol, granularity },
      await future.market.getHistoricalCandlestick(this.client, {
        symbol,
        productType: 'USDT-FUTURES',
        granularity,
        endTime: `${Date.now()}`,
        limit: "200",
      })
    );
  }

  private async collectFutureMarkPriceCandlestick(symbol: string, granularity: string) {
    // update future candlesticks
    this.futureRepo.saveMarkPriceCandlesticks(
      { symbol, granularity },
      await future.market.getHistoricalMarkPriceCandlestick(this.client, {
        symbol,
        productType: 'USDT-FUTURES',
        granularity,
        endTime: `${Date.now()}`,
        limit: "200",
      })
    );
  }

  private async collectSpotCandlestick(symbol: string, granularity: string) {
    // update spot candlesticks
    this.spotRepo.saveCandlesticks(
      { symbol, granularity },
      await spot.market.getHistoricalCandlestick(this.client, {
        symbol,
        granularity,
        endTime: `${Date.now()}`,
        limit: "200",
      })
    );
  }

  private async collectFundingRate(symbol: string) {
    // update funding rates
    const fundingRates = await future.market.getHistoricalFundingRate(this.client, {
      symbol,
      productType: 'USDT-FUTURES',
      pageSize: '100',
      pageNo: '0',
    });
    for (const r of fundingRates) {
      this.futureRepo.saveFundingRate(r)
      // logger.info(JSON.stringify(r));
    }

  }

  public async close() {
    logger.info("Closing Collector...")
    await this.spotRepo.close();
    await this.futureRepo.close();

    logger.info("Closed")
  }

}