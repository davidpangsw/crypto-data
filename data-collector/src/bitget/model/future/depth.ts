/**
 * Depth
 */
export type FutureDepthData = FutureDepthDataItem[];

export interface FutureDepthDataItem {
  bids: FutureDepthLevel[],
  asks: FutureDepthLevel[],
  checksum: number,
  ts: string,
}
export type FutureDepthLevel = string[];

