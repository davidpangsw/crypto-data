import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';

export class Repository {
  private db: InfluxDB;
  private bucket: string;
  private org: string;
  private writeApi: WriteApi;

  constructor(db: InfluxDB, bucket: string, org: string) {
    this.db = db;
    this.bucket = bucket;
    this.org = org;
    this.writeApi = this.db.getWriteApi(this.org, this.bucket, 'ms', {
      flushInterval: 1000, // Flush every second
    });
  }

  //   No schema creation is needed in InfluxDB
  async init(): Promise<void> {
    // this.writeApi = this.db.getWriteApi(this.org, this.bucket, 'ms', {
    //   flushInterval: 1000, // Flush every second
    // });
  }

  async savePoint(point: Point): Promise<void> {
    this.writeApi.writePoint(point);
    // await this.writeApi.flush(); // Force send immediately
  }

  // Close the writeApi when done
  async close(): Promise<void> {
    await this.writeApi.close();
  }
}