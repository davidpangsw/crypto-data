import { InfluxDB } from "@influxdata/influxdb-client";
import { ChannelUpdate } from "./model/update";
import { SubscribeArgument, BitgetWebSocket } from "./utils/bitget_websocket";
import { FutureRepository } from "./repository/future_repository";
import { SpotRepository } from "./repository/spot_repository";
import { builder as zb } from "./utils/zod_builder";
import logger from "../utils/logger";

const SubscribeResponseSchema = zb().event('subscribe').build();
const SubscribeSuccessResponse = zb().event('subscribe').undefined('code').build();
const SnapshotFutureTickerSchema = zb().action('snapshot').instType('USDT-FUTURES').channel(['ticker']).build();
const SnapshotFutureDepthSchema = zb().action('snapshot').instType('USDT-FUTURES').channel(['books', 'books1', 'books5', 'books15']).build();
const UpdateFutureDepthSchema = zb().action('update').instType('USDT-FUTURES').channel(['books']).build();
const SnapshotSpotTickerSchema = zb().action('snapshot').instType('SPOT').channel(['ticker']).build();


export class BitgetWebSocketCollector {
  private ws: BitgetWebSocket;
  private spotRepo: SpotRepository;
  private futureRepo: FutureRepository;
  private symbols : string[] = [];

  constructor(db: InfluxDB, bucketPrefix: string, org: string) {
    this.ws = new BitgetWebSocket();
    this.spotRepo = new SpotRepository(db, `${bucketPrefix}_spot`, org);
    this.futureRepo = new FutureRepository(db, `${bucketPrefix}_future`, org);
  }

  public addSymbols(symbols: string[]) {
    this.symbols.push(...symbols);
  }

  public addSubscriptions(subscriptions: SubscribeArgument[]) {
    this.ws.addSubscriptions(subscriptions);
  }

  public async start() {
    for (const instId of this.symbols) {
      this.addSubscriptions([
        { instType: "USDT-FUTURES", channel: "books5", instId, },
        { instType: "USDT-FUTURES", channel: "ticker", instId, },
        { instType: "SPOT", channel: "ticker", instId },
      ]);
    }
    await this.spotRepo.init();
    await this.futureRepo.init();
    this.ws.connect((update) => this.handle(update));
  }

  private async handle(update: ChannelUpdate) {
    const { event, action, arg, data } = update;

    // Handle subscribe success
    if (SubscribeSuccessResponse.safeParse(update).success) {
      logger.info("Subscribe success", arg);
      return;
    } else if (SnapshotFutureDepthSchema.safeParse(update).success) {
      this.futureRepo.saveDepthSnapshot(update)
      // } else if (UpdateFutureDepthSchema.safeParse(update).success) { // "books" channel only
      //   this.futureRepo.saveDepthUpdate(update);
    } else if (SnapshotFutureTickerSchema.safeParse(update).success) {
      this.futureRepo.saveTickerSnapshot(update);
    } else if (SnapshotSpotTickerSchema.safeParse(update).success) {
      this.spotRepo.saveTickerSnapshot(update)
    } else {
      logger.warn("Unhandled update: ", update);
    }
  }


  public async close() {
    logger.info("Closing Collector...")
    this.ws.close();
    await this.spotRepo.close();
    await this.futureRepo.close();

    logger.info("Closed")
  }

}