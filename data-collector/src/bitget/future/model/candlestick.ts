export type Granularity =
  | "1m"      // 1 minute
  | "3m"      // 3 minutes
  | "5m"      // 5 minutes
  | "15m"     // 15 minutes
  | "30m"     // 30 minutes
  | "1H"      // 1 hour
  | "4H"      // 4 hours
  | "6H"      // 6 hours
  | "12H"     // 12 hours
  | "1D"      // 1 day
  | "3D"      // 3 days
  | "1W"      // 1 week
  | "1M"      // 1 month
  | "6Hutc"   // (UTC 6-hour line)
  | "12Hutc"  // (UTC 12-hour line)
  | "1Dutc"   // (UTC 1-day line)
  | "3Dutc"   // (UTC 3-day line)
  | "1Wutc"   // (UTC weekly line)
  | "1Mutc";  // (UTC monthly line)

/**
 * index[0]	String	Milliseconds format of timestamp Unix, e.g. 1597026383085
 * index[1]	String	Entry price
 * index[2]	String	Highest price
 * index[3]	String	Lowest price
 * index[4]	String	Exit price(Only include the finished K line data)
 * index[5]	String	Trading volume of the base coin
 * index[6]	String	Trading volume of quote currency
 */
export type Candlestick = string[];