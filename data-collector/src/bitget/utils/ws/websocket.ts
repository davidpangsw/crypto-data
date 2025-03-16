// import WebSocket from 'ws';
import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from 'ws';
import logger from '@/utils/logger';
import { InstType, ChannelUpdate } from './update';


export interface SubscribeArgument {
  instType: InstType;
  channel: string;
  instId: string;
}

export class BitgetWebSocket {
  private args: SubscribeArgument[] = [];
  private pingInterval: number;
  private pongReceived: boolean = true;
  private ws: ReconnectingWebSocket;

  constructor(url: string = 'wss://ws.bitget.com/v2/ws/public') {
    this.ws = new ReconnectingWebSocket(url, [], {
      WebSocket: WS, // undefined,
      // maxReconnectionDelay: 10000,
      // minReconnectionDelay: 1000 + Math.random() * 4000,
      // reconnectionDelayGrowFactor: 1.3,
      // minUptime: 5000,
      // connectionTimeout: 4000,
      // maxRetries: Infinity,
      // maxEnqueuedMessages: Infinity,
      // startClosed: false,
      // debug: false,
    });
    this.args = []; // Default to an empty array

    this.pingInterval = 30000; // Send and verify ping every 30 seconds
  }

  public addSubscriptions(args: SubscribeArgument[]): void {
    this.args.push(...args);
  }
  public connect(onMessage: (update: ChannelUpdate) => void): void {
    const ws = this.ws;
    ws.onopen = () => {
      logger.info('Connection opened');
      ws.send(JSON.stringify({ op: "subscribe", args: this.args, }));
      this.pongReceived = true;
      this.startPingTimer();
    };

    ws.onmessage = (message) => {
      const data = message.data;
      if (message.data === 'pong') {
        this.pongReceived = true;
        logger.debug('Pong received');
        return;
      }
      // logger.info('Received message:', message.data);
      const body = data.toString();
      const update = JSON.parse(body);
      // logger.info(update)
      onMessage(update)
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = (event) => {
      logger.info('Connection closed:', event.code, event.reason);
      if (event.code === 1000) {
        logger.info('Connection closed normally');
      } else {
        console.error('Connection closed abnormally');
      }
    };
  }

  public close(): void {
    this.ws.close();
  }

  /**
   * 
   */
  // Start a timer to send "ping"
  private startPingTimer() {
    setInterval(() => {
      try {
        if (this.pongReceived) {
          this.ws.send('ping');
          this.pongReceived = false;
        } else {
          logger.warn(`No pong received within ${this.pingInterval} ms.`);
          this.ws.reconnect();
        }
      } catch (error) {
        logger.error(error);
        throw error;
      }
    }, this.pingInterval);
  }

}
