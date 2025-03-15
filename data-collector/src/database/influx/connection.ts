import { InfluxDB } from '@influxdata/influxdb-client';
import { influxConfig } from '../../../src/config/influx';

export function connectDefault() {
    return connect(influxConfig.url, influxConfig.token);
}
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