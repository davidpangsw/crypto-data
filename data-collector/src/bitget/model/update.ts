import { FutureDepthData } from "./future/depth";
import { InstType } from "./instrument";
import { FutureTickerData } from "./future/ticker";
import { SpotTickerData } from "./spot/ticker";

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