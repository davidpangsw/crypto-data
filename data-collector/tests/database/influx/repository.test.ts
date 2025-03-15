// tests/database/influx/repository.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { Repository } from '../../../src/database/influx/repository'; // Adjust path as needed
import { connectDefault } from '../../../src/database/influx/connection';

// Configuration - adjust these to match your local setup
const INFLUX_ORG = 'organization';
const INFLUX_BUCKET = 'test-bucket'; // Use a test-specific bucket

describe('Repository', () => {
  let influxDB: InfluxDB;
  let repository: Repository;
  beforeAll(async () => { influxDB = connectDefault(); });
  beforeEach(async () => {
    repository = new Repository(influxDB, INFLUX_BUCKET, INFLUX_ORG);
    await repository.init();
  });
  afterAll(async () => { await repository.close(); });

  it('saves and retrieves a point', async () => {
    // Write a point
    const point = new Point('test')
      .tag('sensor', 'test1')
      .floatField('value', 42.5);
    await repository.savePoint(point);
    await repository.close(); // Flush data

    // Query it back
    const queryApi = influxDB.getQueryApi(INFLUX_ORG);
    const fluxQuery = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -1m)
        |> filter(fn: (r) => r._measurement == "test")
        |> last()
    `;
    const result = await queryApi.collectRows<{
      _value: number,
      sensor: string,
    }>(fluxQuery);

    expect(result.length).toBe(1);
    expect(result[0]._value).toBe(42.5);
    expect(result[0].sensor).toBe('test1');
  });
});