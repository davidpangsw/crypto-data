from decimal import Decimal
import os
import traceback
from influxdb_client import InfluxDBClient
import numpy as np
import pandas as pd
from utils.math import to_decimal
from repository.repository import Repository
from config.influx import INFLUX_URL, INFLUX_TOKEN, INFLUX_ORG
from config.data import data_dir
import logging 

# Configure basic logging
logging.basicConfig(level=logging.INFO)

# Create a logger
logger = logging.getLogger(__name__)  # __name__ gives the module name

# Log some messages
logger.debug("This is a debug message")    # Won't show unless level is DEBUG
logger.info("This is an info message")
logger.warning("This is a warning message")
logger.error("This is an error message")
logger.critical("This is a critical message")

def inspect(value):
    print(value, type(value))

#
trading_fee = Decimal('0.0256') / Decimal('100') # best tier taker in Bitget


# Connection parameters

# Initialize the client
symbol = "ALTUSDT"
bucket_prefix = "bitget"
client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
repo = Repository(client, bucket_prefix)


def analyse(symbol, start, end):
    logger.info("analyse", symbol, start, end)

    if os.path.exists(data_dir / "merge.csv"):
        logger.info("reading data...")
        df = pd.read_csv(data_dir / 'merge.csv')
    else:
        logger.info("fetching data...")
        df = repo.query_merged_ticker(symbol, start, end)

    # Drop only the leading rows where 'lastPr_spot' is NaN
    df = df[df['lastPr_spot'].notna() | (df.index >= df['lastPr_spot'].first_valid_index())]
    # df = df[df['lastPr_spot'].notna() | (df.index >= df['lastPr_spot'].first_valid_index())]

    # assuming there are no na, we apply to_decimal
    df['lastPr_future'] = df['lastPr_future'].apply(to_decimal)
    df['lastPr_spot'] = df['lastPr_spot'].apply(to_decimal)
    df['markPrice'] = df['markPrice'].apply(to_decimal)
    df['fundingRate'] = df['fundingRate'].apply(to_decimal)

    # basis = spot - perp
    # portfolio = (spot - perp) * q
    # portfolio -= q * mark_price * fund_rate
    # rebalance?
    df['basis'] = df['lastPr_spot'] - df['lastPr_future']
    df['basis'] = df['basis'].apply(to_decimal)
    df['position'] = np.where(df['basis'] < 0, 
                              Decimal('1'), 
                              np.where(df['basis'] > 0,
                                       Decimal('-1'), 
                                       np.where(df['basis'] == 0,
                                                Decimal('0'),
                                                np.nan
                                                )))
    df['position'] = df['position'].ffill()
    df['position'] = df['position'].apply(to_decimal)
    df['trade'] = df['position'] - df['position'].shift(1)
    df['trade'] = df['trade'].fillna(Decimal('0'))
    df['trade'] = df['trade'].apply(to_decimal)

    # df['basis_cross_u'] = (df['basis'].shift(1) < 0) & (df['basis'] > 0)  # Detect upward cross
    # df['basis_cross_d'] = (df['basis'].shift(1) > 0) & (df['basis'] < 0)  # Detect downward cross
    # df['trade'] = np.where(df['basis_cross_d'], 1, np.where(df['basis_cross_u'], -1, 0))
    # df['trade'] = df['trade'].apply(to_decimal)
    # df['position'] = np.cumsum(df['trade'])
    # df['position'] = df['position'].apply(to_decimal)
    df['pnl'] = np.cumsum(-df['trade'] * df['basis'].fillna(0))
    df['pnl'] = df['pnl'].apply(to_decimal)
    # df['pnl'] = [Decimal(0)] * len(df)
    # print(df)
    # df.reset_index(drop=True, inplace=True)
    # for i in range(1, len(df)):
    #     df.loc[i, 'pnl'] = df.loc[i-1, 'pnl'] + (df.loc[i, 'trade'] * df.loc[i, 'basis'])


    ### funding
    # https://www.bitget.com/support/articles/12560603817108

    # fund_fee = q_perp * mark_price * fund_rate
    # fund_rate > 0  => longs pay shorts
    df['funding_fee'] = df.apply(lambda row: row['markPrice'] * row['fundingRate'], axis=1)
    df['funding_fee'] = df['funding_fee'].fillna(value=Decimal('0'))
    df['cumulative_funding_fee'] = df['funding_fee'].cumsum()

    ## trading fee
    df['trading_fee'] = df['trade'].abs() * trading_fee * Decimal('2')
    inspect(df['trading_fee'].iloc[10])
    # print(df['trading_fee'].apply(type))  # Should all print <class 'decimal.Decimal'>
    df['trading_fee'] = df['trading_fee'].apply(to_decimal)
    df['cumulative_trading_fee'] = df['trading_fee'].cumsum()
    df['cumulative_trading_fee'] = df['cumulative_trading_fee'].apply(to_decimal)

    ### drop the several rows to avoid:
    # empty future price from merging
    # isFundingTimeChanged is true in the first row
    # df.drop(index=df.index[:10], inplace=True)
    # df.reset_index(drop=True, inplace=True)

    # output
    logger.info("outputting data...")
    # df.to_csv(data_dir / "result.csv", index=False)
    # dfbasis'] = pd.to_numeric(df['basis'], errors='coerce')
    # df['_time'] = df['_time'].dt.tz_localize(None)
    df.to_excel(data_dir / "result.xlsx", index=False)

    df = df[(df['trade'] != Decimal('0')) | (df['funding_fee'] != Decimal('0'))]
    df.to_excel(data_dir / "result_filtered.xlsx", index=False)

    print(df.head(5))

def analyse_candlestick(symbol, start, end):
    df = repo.query_merged_candlestick(symbol, start, end)
    df['basis'] = df['close_spot'] - df['close_future']
    df['funding_fee'] = df.apply(lambda row: row['close_future_mark_price'] * row['fundingRate'], axis=1)
    df.to_csv(data_dir / "result.csv", index=False)

try:
    analyse(symbol, "-176h", "-128h")
    # analyse(symbol, "-36h", "0h")
except Exception as e:
    print(f"Error occurred: {e}")
    traceback.print_exc()
finally:
    # Close the client
    client.close()
