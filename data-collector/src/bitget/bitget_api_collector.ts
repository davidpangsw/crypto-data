import { InfluxDB } from "@influxdata/influxdb-client";
import logger from "@/utils/logger";
import { sleep } from "@/utils/async";
import { ApiClient } from "@/utils/api_client";
import { FutureRepository } from "./future/repository/future_repository";
import { SpotRepository } from "./spot/repository/spot_repository";
import { future, spot } from "./facade";
import { Granularity as FutureGranularity } from "./future/model/candlestick";
import { Granularity as SpotGranularity } from "./spot/model/candlestick";

interface BitgetApiCollectorConfig {
  futureRepo: FutureRepository;
  spotRepo: SpotRepository;

  symbols: string[],
  futureGranularity: FutureGranularity;
  spotGranularity: SpotGranularity;
  sleepMs: number;
}

export class BitgetApiCollector {
  private client: ApiClient;
  private config: BitgetApiCollectorConfig;

  constructor(config: BitgetApiCollectorConfig) {
    this.config = config;
    this.client = new ApiClient();
  }

  public async start() {
    const { symbols, futureGranularity, spotGranularity, sleepMs } = this.config;

    if (symbols.length == 0) {
      logger.warn("No symbols assigned");
      return;
    }
    while (true) {
      for (const symbol of symbols) {
        this.collectFutureCandlestick(symbol, futureGranularity);
        this.collectFutureMarkPriceCandlestick(symbol, futureGranularity);
        this.collectSpotCandlestick(symbol, spotGranularity);
        this.collectFundingRate(symbol);
      }
      await sleep(sleepMs);
    }
  }

  private async collectFutureCandlestick(symbol: string, granularity: FutureGranularity) {
    const { futureRepo } = this.config;

    // update future candlesticks
    futureRepo.saveCandlesticks(
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

  private async collectFutureMarkPriceCandlestick(symbol: string, granularity: FutureGranularity) {
    const { futureRepo } = this.config;

    // update future candlesticks
    futureRepo.saveMarkPriceCandlesticks(
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

  private async collectSpotCandlestick(symbol: string, granularity: SpotGranularity) {
    const { spotRepo } = this.config;

    // update spot candlesticks
    spotRepo.saveCandlesticks(
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
    const { futureRepo } = this.config;

    // update funding rates
    const fundingRates = await future.market.getHistoricalFundingRate(this.client, {
      symbol,
      productType: 'USDT-FUTURES',
      pageSize: '100',
      pageNo: '0',
    });
    for (const r of fundingRates) {
      futureRepo.saveFundingRate(r)
      // logger.info(JSON.stringify(r));
    }

  }

  public async close() {
    logger.info("Closing Collector...")

    logger.info("Closed")
  }

}