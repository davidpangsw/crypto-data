import dotenv from 'dotenv';
dotenv.config();

export const env = process.env as {
  INFLUX_URL: string,
  INFLUX_TOKEN: string,
};
