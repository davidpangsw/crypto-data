
from decimal import Decimal
import os
import traceback
from influxdb_client import InfluxDBClient
import numpy as np
import pandas as pd
from utils.math import apply_to_decimal, to_decimal
from repository.repository import Repository
from config.influx import INFLUX_URL, INFLUX_TOKEN, INFLUX_ORG
from config.data import data_dir
import logging 
from strategy.basic_funding_arbitrage import analyse

from decimal import Decimal


trading_fee = Decimal('0.0256') / Decimal('100') # best tier taker in Bitget

# Initialize the client
symbol = "ALTUSDT"
bucket_prefix = "bitget"
client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
repo = Repository(client, bucket_prefix)

def analyse_candlestick(symbol, start, end):
    df = repo.query_merged_candlestick(symbol, start, end)
    df['basis'] = df['close_spot'] - df['close_future']
    df['funding_fee'] = df.apply(lambda row: row['close_future_mark_price'] * row['fundingRate'], axis=1)
    df.to_csv(data_dir / "result.csv", index=False)
