import { InfluxDB } from '@influxdata/influxdb-client';
export function connect(url: string, token: string) {
  const influxDB = new InfluxDB({
    url,
    token,
    // transportOptions: { debug: true } // Enable debug logs
    // writeOptions : {
    //   flushInterval: 500,
    // }
  });
  return influxDB;
}