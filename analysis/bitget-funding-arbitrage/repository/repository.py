import os
import pandas as pd
from utils.math import to_decimal
from config.data import data_dir


def save(df, filename):
    print()
    print()
    print("saving...", filename)
    # print(df.head(5))
    print(df.iloc[len(df)//4: len(df)//4 + 10])
    df.to_csv(data_dir / filename, index=False)
    return df


def load(filename):
    print()
    print()
    print("loading...", filename)
    df = pd.read_csv(data_dir / filename)
    df['_time'] = pd.to_datetime(df['_time'], format='ISO8601') # DO NOT use parse_date. It sucks at several formats.
    # print(df)
    print(df.iloc[len(df)//4: len(df)//4 + 10])
    return df


def exists(filename):
    return os.path.exists(data_dir / filename)


class Repository:
    def __init__(self, client, bucket_prefix):
        self.query_api = client.query_api()
        self.bucket_prefix = bucket_prefix

    def query_future_candlestick(self, symbol, start, stop, granularity):
        bucket_prefix = self.bucket_prefix
        query_api = self.query_api
        query = f'''
            from(bucket: "{bucket_prefix}_future")
            |> range(start: {start}, stop: {stop})
            |> filter(fn: (r) => r["_measurement"] == "candlestick")
            |> filter(fn: (r) => r["_field"] == "entry" or r["_field"] == "high" or r["_field"] == "low" or r["_field"] == "exit" or r["_field"] == "baseVolume" or r["_field"] == "quoteVolume")
            |> filter(fn: (r) => r["symbol"] == "{symbol}")
            |> filter(fn: (r) => r["granularity"] == "{granularity}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        df = query_api.query_data_frame(query)
        df = df \
            .drop(columns=['result', '_measurement', '_start', '_stop', 'table'])  \
            .rename(columns={'entry': 'open'}) \
            .rename(columns={'exit': 'close'}) \
            .sort_values('_time')
        # .drop(columns=['symbol']) \
        return df[['_time', 'open', 'high', 'low', 'close']]
        # return df[['_time', 'open', 'high', 'low', 'close', 'baseVolume', 'quoteVolume']]

    def query_future_mark_price_candlestick(self, symbol, start, stop, granularity):
        bucket_prefix = self.bucket_prefix
        query_api = self.query_api
        query = f'''
            from(bucket: "{bucket_prefix}_future")
            |> range(start: {start}, stop: {stop})
            |> filter(fn: (r) => r["_measurement"] == "mark_price_candlestick")
            |> filter(fn: (r) => r["_field"] == "entry" or r["_field"] == "high" or r["_field"] == "low" or r["_field"] == "exit" or r["_field"] == "baseVolume" or r["_field"] == "quoteVolume")
            |> filter(fn: (r) => r["symbol"] == "{symbol}")
            |> filter(fn: (r) => r["granularity"] == "{granularity}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        df = query_api.query_data_frame(query)
        df = df \
            .drop(columns=['result', '_measurement', '_start', '_stop', 'table'])  \
            .rename(columns={'entry': 'open'}) \
            .rename(columns={'exit': 'close'}) \
            .sort_values('_time')
        # .drop(columns=['symbol']) \
        return df[['_time', 'open', 'high', 'low', 'close']]
        # return df[['_time', 'open', 'high', 'low', 'close', 'baseVolume', 'quoteVolume']]

    def query_spot_candlestick(self, symbol, start, stop, granularity):
        bucket_prefix = self.bucket_prefix
        query_api = self.query_api
        query = f'''
            from(bucket: "{bucket_prefix}_spot")
            |> range(start: {start}, stop: {stop})
            |> filter(fn: (r) => r["_measurement"] == "candlestick")
            |> filter(fn: (r) => r["_field"] == "open" or r["_field"] == "high" or r["_field"] == "low" or r["_field"] == "close" or r["_field"] == "baseVolume" or r["_field"] == "quoteVolume" or r["_field"] == "usdtVolume")
            |> filter(fn: (r) => r["symbol"] == "{symbol}")
            |> filter(fn: (r) => r["granularity"] == "{granularity}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        df = query_api.query_data_frame(query)
        df = df \
            .drop(columns=['result', '_measurement', '_start', '_stop', 'table'])  \
            .drop(columns=['symbol']) \
            .sort_values('_time')
        return df[['_time', 'open', 'high', 'low', 'close']]
        # return df[['_time', 'open', 'high', 'low', 'close', 'baseVolume', 'quoteVolume', 'usdtVolume']]
        # print(query)
        # return df

    def query_funding_rate(self, symbol, start, stop):
        """
        _time, fundingRate
        """
        bucket_prefix = self.bucket_prefix
        query_api = self.query_api
        query = f'''
            from(bucket: "{bucket_prefix}_future")
            |> range(start: {start}, stop: {stop})
            |> filter(fn: (r) => r["_measurement"] == "fundingRate")
            |> filter(fn: (r) => r["_field"] == "fundingRate")
            |> filter(fn: (r) => r["symbol"] == "{symbol}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        df = query_api.query_data_frame(query)
        df = df \
            .drop(columns=['result', '_measurement', '_start', '_stop', 'table'])  \
            .sort_values('_time')
        # .drop(columns=['symbol']) \
        return df[['_time', 'fundingRate']]

    def query_merged_candlestick(self, symbol, start, stop, cachefile="merge.csv"):
        future = save(self.query_future_candlestick(
            symbol, start, stop, "15m"), "future.csv")
        future_mark_price = save(self.query_future_mark_price_candlestick(
            symbol, start, stop, "15m"), "future_mark_price.csv")
        spot = save(self.query_spot_candlestick(
            symbol, start, stop, "15min"), "spot.csv")
        # funding = save(self.query_funding_rate(symbol, start, stop), "funding.csv")

        # # Merge with nearest timestamp
        df = pd.merge_asof(future, future_mark_price, on='_time',
                           suffixes=('', '_future_mark_price'),
                           direction='backward', tolerance=pd.Timedelta('500ms'))
        df = pd.merge_asof(df, spot, on='_time',
                           suffixes=('_future', '_spot'),
                           direction='backward', tolerance=pd.Timedelta('500ms'))
        # df = pd.merge_asof(df, funding, on='_time',
        #                    suffixes=('', '_funding'),
        #                    direction='backward', tolerance=pd.Timedelta('500ms'))
        df = save(df, cachefile)

        return df

    def query_future_ticker(self, instId, start, stop):
        """
        _time, lastPr, markPrice, fundingRate
        """
        bucket_prefix = self.bucket_prefix
        query_api = self.query_api
        query = f'''
            from(bucket: "{bucket_prefix}_future")
            |> range(start: {start}, stop: {stop})
            |> filter(fn: (r) => r._measurement == "tickerData")
            |> filter(fn: (r) => r["instId"] == "{instId}")
            |> filter(fn: (r) => r._field == "lastPr" or r._field == "markPrice" or r._field == "fundingRate")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        df = query_api.query_data_frame(query)
        print(df)
        df = df \
            .drop(columns=['result', '_measurement', '_start', '_stop', 'table'])  \
            .drop(columns=['instId', 'channel']) \
            .sort_values('_time')
        df['lastPr'] = df['lastPr'].apply(to_decimal)
        return df

    def query_spot_ticker(self, instId, start, stop):
        """
        _time, lastPr
        """
        bucket_prefix = self.bucket_prefix
        query_api = self.query_api
        query = f'''
            from(bucket: "{bucket_prefix}_spot")
            |> range(start: {start}, stop: {stop})
            |> filter(fn: (r) => r._measurement == "tickerData")
            |> filter(fn: (r) => r["instId"] == "{instId}")
            |> filter(fn: (r) => r._field == "lastPr")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        df = query_api.query_data_frame(query)
        df = df \
            .drop(columns=['result', '_measurement', '_start', '_stop', 'table'])  \
            .drop(columns=['instId', 'channel']) \
            .sort_values('_time')
        df['lastPr'] = df['lastPr'].apply(to_decimal)
        return df

    def fetch_merged_ticker(self, instId, start, stop, readCache):
        """
        _time, lastPr_future, lastPr_spot, markPrice, fundingRate, fundingRate_future
        """
        filename = 'merge.csv'
        if not (readCache and exists(filename)):
            print("fetching data...")

            # fetch data
            symbol = instId
            future = save(self.query_future_ticker(instId, start, stop), "future.csv")
            spot = save(self.query_spot_ticker(instId, start, stop), "spot.csv")
            funding = save(self.query_funding_rate(symbol, start, stop), "funding.csv")

            # Merge with nearest timestamp
            df = pd.merge_asof(future, funding, on='_time',
                               direction='backward', tolerance=pd.Timedelta('500ms'),
                               suffixes=('_future', ''))
            df = pd.merge_asof(df, spot, on='_time',
                               direction='backward', tolerance=pd.Timedelta('500ms'),
                               suffixes=('_future', '_spot'))
            df = df[['_time', 'lastPr_future', 'lastPr_spot',
                     'markPrice', 'fundingRate', 'fundingRate_future']]

            df = save(df, filename)

        print("loading data...")
        df = load(filename)

        return df
