from trader.trader import Trader


class FundingRateTrader(Trader):
    """
    buy spot, sell perp

    Raw data:
    spot = last_tick
    perp = last_future_tick
    mark = last_mark_price
    fund_rate = last_fund_rate

    Calculate:
    basis = spot - perp
    portfolio = (spot - perp) * q
    portfolio -= q * mark_price * fund_rate
    rebalance?

    ## funding
    https://www.bitget.com/support/articles/12560603817108

    fund_fee = q_perp * mark_price * fund_rate
    fund_rate > 0  => longs pay shorts

    """
    def __init__(self):
        super().__init__()

    def process(self, record):
        # raw data
        timestamp = self.get_timestamp()
        perp = self.get_last_future_tick()
        mark = self.get_last_mark_price()
        fund_rate = self.get_fund_rate()

        spot = self.get_last_spot_tick()
        is_pay_fund = self.get_is_pay_fund

        # calculations
        basis = spot - perp
        fund_fee = mark * fund_rate if is_pay_fund else 0

        # save
        self.append(timestamp, spot, perp, mark, fund_rate, is_pay_fund, basis, fund_fee)

    def close(self):
        self.save()
