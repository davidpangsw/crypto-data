import logger from "@/utils/logger";
import { ChannelUpdate } from "./utils/ws/update";
import { BitgetWebSocket } from "./utils/ws/websocket";
import { FutureRepository } from "./future/repository/future_repository";
import { SpotRepository } from "./spot/repository/spot_repository";
import { builder as zb } from "./utils/zod_builder";

const SubscribeResponseSchema = zb().event('subscribe').build();
const SubscribeSuccessResponse = zb().event('subscribe').undefined('code').build();
const SnapshotFutureTickerSchema = zb().action('snapshot').instType('USDT-FUTURES').channel(['ticker']).build();
const SnapshotFutureDepthSchema = zb().action('snapshot').instType('USDT-FUTURES').channel(['books', 'books1', 'books5', 'books15']).build();
const UpdateFutureDepthSchema = zb().action('update').instType('USDT-FUTURES').channel(['books']).build();
const SnapshotSpotTickerSchema = zb().action('snapshot').instType('SPOT').channel(['ticker']).build();

interface BitgetWebSocketCollectorConfig {
  futureRepo: FutureRepository;
  spotRepo: SpotRepository;

  instIds: string[],
  futureChannels: string[],
  spotChannels: string[],
}

export class BitgetWebSocketCollector {
  private config: BitgetWebSocketCollectorConfig;
  private ws: BitgetWebSocket;

  constructor(config: BitgetWebSocketCollectorConfig) {
    this.config = config;
    this.ws = new BitgetWebSocket();
  }

  public async start() {
    const {instIds, futureChannels, spotChannels} = this.config;
    for (const instId of instIds) {
      for (const channel of futureChannels) {
        this.ws.addSubscriptions([
          { instType: "USDT-FUTURES", channel, instId, },
        ]);
      }
      for (const channel of spotChannels) {
        this.ws.addSubscriptions([
          { instType: "SPOT", channel, instId, },
        ]);
      }
    }
    this.ws.connect((update: ChannelUpdate) => this.handle(update));
  }

  private async handle(update: ChannelUpdate) {
    const { event, action, arg, data } = update;
    const { futureRepo, spotRepo } = this.config;

    // Handle subscribe success
    if (SubscribeSuccessResponse.safeParse(update).success) {
      logger.info("Subscribe success", arg);
      return;
    } else if (SnapshotFutureDepthSchema.safeParse(update).success) {
      futureRepo.saveDepthSnapshot(update)
      // } else if (UpdateFutureDepthSchema.safeParse(update).success) { // "books" channel only
      //   this.futureRepo.saveDepthUpdate(update);
    } else if (SnapshotFutureTickerSchema.safeParse(update).success) {
      futureRepo.saveTickerSnapshot(update);
    } else if (SnapshotSpotTickerSchema.safeParse(update).success) {
      spotRepo.saveTickerSnapshot(update)
    } else {
      logger.warn("Unhandled update: ", update);
    }
  }


  public async close() {
    logger.info("Closing BitgetWebSocketCollector...")
    this.ws.close();
    logger.info("Closed")
  }

}