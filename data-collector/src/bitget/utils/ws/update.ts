import { FutureDepthData } from "../../future/model/depth";
import { FutureTickerData } from "../../future/model/ticker";
import { SpotTickerData } from "../../spot/model/ticker";

export type InstType = 'SPOT' | 'USDT-FUTURES';
export interface ChannelUpdate {
  event: string,
  action?: string,
  arg: ChannelUpdateArgument,
  data: ChannelData,
}

export interface ChannelUpdateArgument {
    instType: InstType,
    channel: string,
    instId: string,
}

export type ChannelData = FutureTickerData | FutureDepthData | SpotTickerData;