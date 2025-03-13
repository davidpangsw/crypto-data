import { env } from "./env";

export const influxConfig = {
  url: env.INFLUX_URL,
  token: env.INFLUX_TOKEN,
}