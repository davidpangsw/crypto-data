import { sleepForever } from './utils/async';
import { connect } from './database/influx/connection';
import { BitgetWebSocketCollector } from './bitget/bitget_websocket_collector';
import logger from './utils/logger';
import { BitgetApiCollector } from './bitget/bitget_api_collector';
import { bitgetConfig } from './config/bitget';
import { influxConfig } from './config/influx';

let ws, api;

async function main() {
  const db = connect(influxConfig.url, influxConfig.token);
  const {
    collector: {
      symbols,
      influx: { bucket, organization }
    }
  } = bitgetConfig;

  // collector
  ws = new BitgetWebSocketCollector(db, bucket, organization);
  ws.start();
  api = new BitgetApiCollector(db, bucket, organization);
  api.addSymbols(symbols);
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
  } catch (err) {
    console.error("Error during collector shutdown:", err);
  }
  process.exit(0); // Exit the process gracefully after cleanup
});

main().catch(logger.error);