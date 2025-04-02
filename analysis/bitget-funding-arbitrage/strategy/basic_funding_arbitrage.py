from decimal import Decimal
import numpy as np
import pandas as pd
from utils.math import apply_to_decimal, to_decimal
from repository.repository import Repository
from config.data import data_dir
import logging 

# Create a logger
logger = logging.getLogger(__name__)

def inspect(value):
    print(value, type(value))

#
trading_fee = Decimal('0.0256') / Decimal('100') # best tier taker in Bitget

# Initialize the client
def analyse(repo: Repository, symbol, start, end):
    logger.info("analyse", symbol, start, end)

    df = repo.fetch_merged_ticker(symbol, start, end, readCache=True)

    """
    Edit Data
    """
    # Drop only the leading rows where 'lastPr_spot' is NaN
    df = df[df['lastPr_spot'].notna() | (df.index >= df['lastPr_spot'].first_valid_index())]
    # assuming there are no na, we apply to_decimal
    df = apply_to_decimal(df, ['lastPr_future', 'lastPr_future', 'lastPr_spot', 'markPrice', 'fundingRate', 'fundingRate_future'])

    """
    Apply Trading Strategy
    """
    # basis = spot - perp
    df['basis'] = df['lastPr_spot'] - df['lastPr_future']

    # position and trade
    df['position'] = np.where((df['basis'] < 0) & (df['fundingRate_future'] < 0), to_decimal('1'), 
                     np.where((df['basis'] > 0) & (df['fundingRate_future'] > 0), to_decimal('-1'), 
                    #  np.where(df['basis'] == 0, to_decimal('0'),
                              np.nan))
    if pd.isna(df['position'].iloc[0]):
        df['position'].iloc[0] = Decimal('0')
    df['position'] = df['position'].ffill()
    df['position'] = df['position'].apply(to_decimal)
    df['trade'] = df['position'] - df['position'].shift(1)
    df['trade'] = df['trade'].fillna(Decimal('0'))
    # df['trade'] = df['trade'].apply(to_decimal)
    # df['basis_cross_u'] = (df['basis'].shift(1) < 0) & (df['basis'] > 0)  # Detect upward cross
    # df['basis_cross_d'] = (df['basis'].shift(1) > 0) & (df['basis'] < 0)  # Detect downward cross
    # df['trade'] = np.where(df['basis_cross_d'], 1, np.where(df['basis_cross_u'], -1, 0))
    # df['trade'] = df['trade'].apply(to_decimal)
    # df['position'] = np.cumsum(df['trade'])
    # df['position'] = df['position'].apply(to_decimal)

    """
    Statistics
    """
    # pnl
    df['pnl'] = np.cumsum(-df['trade'] * df['basis'].fillna(0))
    df['pnl'] = df['pnl'].apply(to_decimal)
    # df['pnl'] = [Decimal(0)] * len(df)
    # print(df)
    # df.reset_index(drop=True, inplace=True)
    # for i in range(1, len(df)):
    #     df.loc[i, 'pnl'] = df.loc[i-1, 'pnl'] + (df.loc[i, 'trade'] * df.loc[i, 'basis'])

    # funding
    # https://www.bitget.com/support/articles/12560603817108
    # fund_fee = q_perp * mark_price * fund_rate
    # fund_rate > 0  => longs pay shorts
    df['funding_fee'] = df.apply(lambda row: row['markPrice'] * row['position'] * row['fundingRate'], axis=1)
    df['funding_fee'] = df['funding_fee'].fillna(value=Decimal('0'))
    df['cumulative_funding_fee'] = df['funding_fee'].cumsum()

    # trading fee
    df['trading_fee'] = df['trade'].abs() * trading_fee * Decimal('2')
    inspect(df['trading_fee'].iloc[10])
    # print(df['trading_fee'].apply(type))  # Should all print <class 'decimal.Decimal'>
    df['trading_fee'] = df['trading_fee'].apply(to_decimal)
    df['cumulative_trading_fee'] = df['trading_fee'].cumsum()
    df['cumulative_trading_fee'] = df['cumulative_trading_fee'].apply(to_decimal)

    """
    Output results to excel
    """
    logger.info("outputting data...")
    # df['basis'] = pd.to_numeric(df['basis'], errors='coerce')
    df['_time'] = df['_time'].dt.tz_localize(None)
    # Replace zeros with NaN in 'trade' and 'funding_fee' columns
    df['trade'] = df['trade'].replace(Decimal('0'), np.nan)
    df['funding_fee'] = df['funding_fee'].replace(Decimal('0'), np.nan)
    df.to_excel(data_dir / "result.xlsx", index=False)

    # filtered out the trades occured, and output to excel
    # df = df[(df['trade'] != Decimal('0')) | (df['funding_fee'] != Decimal('0'))]
    df = df.dropna(subset=['trade', 'funding_fee'], how='all')
    df.to_excel(data_dir / "result_filtered.xlsx", index=False)

    ###
    print(df.head(5))