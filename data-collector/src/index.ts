import { sleepForever } from './utils/async';
import { connect } from './database/influx/connection';
import logger from './utils/logger';
import { BitgetApiCollector } from './bitget/bitget_api_collector';
import { bitgetConfig } from './config/bitget';
import { influxConfig } from './config/influx';
import { BitgetWebSocketCollector } from './bitget/bitget_websocket_collector';
import { FutureRepository } from './bitget/future/repository/future_repository';
import { SpotRepository } from './bitget/spot/repository/spot_repository';

let ws: BitgetWebSocketCollector;
let api: BitgetApiCollector;
let futureRepo: FutureRepository;
let spotRepo: SpotRepository;


async function main() {
  const db = connect(influxConfig.url, influxConfig.token);
  const {
    collector: {
      symbols,
      influx: { bucketPrefix, organization }
    }
  } = bitgetConfig;

  // collector
  futureRepo = new FutureRepository(db, `${bucketPrefix}_future`, organization);
  spotRepo = new SpotRepository(db, `${bucketPrefix}_spot`, organization);
  await futureRepo.init();
  await spotRepo.init();
  ws = new BitgetWebSocketCollector(
    {
      futureRepo,
      spotRepo,

      instIds: symbols,
      futureChannels: ["books5", "ticker"],
      spotChannels: ["ticker"],
    }
  );
  ws.start();
  api = new BitgetApiCollector(
    {
      futureRepo,
      spotRepo,

      symbols,
      futureGranularity: "15m",
      spotGranularity: "15min",
      sleepMs: 15 * 60 * 1000,
    }
  );
  api.start();

  // sleep forever
  logger.info("Main sleeping...");
  await sleepForever();
}

// Set up signal listener to handle Ctrl+C (SIGINT)
process.on('SIGINT', async () => {
  console.log('Caught SIGINT, shutting down...');
  try {
    if (ws) { await ws.close(); }
    if (api) { await api.close(); }
    if (spotRepo) { await spotRepo.close(); }
    if (futureRepo) { await futureRepo.close(); }
  } catch (err) {
    console.error("Error during collector shutdown:", err);
  }
  process.exit(0); // Exit the process gracefully after cleanup
});

main().catch(logger.error);