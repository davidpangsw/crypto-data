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
      influx: { bucketPrefix, organization },
      ws: wsConfig,
      api: apiConfig,
    }
  } = bitgetConfig;

  // repo
  futureRepo = new FutureRepository(db, `${bucketPrefix}_future`, organization);
  spotRepo = new SpotRepository(db, `${bucketPrefix}_spot`, organization);
  await futureRepo.init();
  await spotRepo.init();

  // collector
  ws = new BitgetWebSocketCollector(
    {
      futureRepo,
      spotRepo,
      ...wsConfig,
    }
  );
  ws.start();
  api = new BitgetApiCollector(
    {
      futureRepo,
      spotRepo,
      ...apiConfig,
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
    if (futureRepo) { await futureRepo.close(); }
    if (spotRepo) { await spotRepo.close(); }
  } catch (err) {
    console.error("Error during collector shutdown:", err);
  }
  process.exit(0); // Exit the process gracefully after cleanup
});

main().catch(logger.error);