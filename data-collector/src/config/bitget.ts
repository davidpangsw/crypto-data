import { Granularity as FutureGranularity } from "@/bitget/future/model/candlestick";
import { Granularity as SpotGranularity } from "@/bitget/spot/model/candlestick";

const symbols = ['ALTUSDT', 'FARTCOINUSDT', 'ALCHUSDT'];

export const bitgetConfig = {
  collector: {
    influx: {
      bucketPrefix: "bitget",
      organization: "organization",
    },
    ws: {
      instIds: symbols,
      futureChannels: ["books5", "ticker"],
      spotChannels: ["ticker"],
    },
    api: {
      symbols,
      futureGranularity: "15m" as FutureGranularity,
      spotGranularity: "15min" as SpotGranularity,
      sleepMs: 15 * 60 * 1000,
    },
  }
}