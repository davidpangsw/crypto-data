from decimal import Decimal
import sys
import pandas as pd

# Sample DataFrame with Decimal values
df = pd.DataFrame({'trade': [Decimal('0.0'), Decimal('-2.67'), Decimal('5.89')]})

# Ensure trading_fee is Decimal
trading_fee = Decimal('0.0256')  # Don't use float; use Decimal

# Perform the calculation, ensuring all terms are Decimal
result = df['trade'].abs().iloc[0] * trading_fee * Decimal('2')

# Inspect the value and its type
def inspect(value):
    print(value, type(value))

inspect(df['trade'].iloc[0])  # Inspect value in df['trade']
inspect(df['trade'].abs().iloc[0])  # Inspect abs value of df['trade']
inspect(trading_fee)  # Inspect trading_fee
inspect(Decimal('2'))  # Inspect multiplier 2
inspect(result)  # Inspect final result of multiplication


sys.exit()

# Sample DataFrame
data = {'trade': [Decimal('10.5'), Decimal('20.7'), Decimal('30.1')],
        'basis': [Decimal('1.1'), Decimal('1.2'), Decimal('1.3')]}

df = pd.DataFrame(data)

# Initialize 'pnl' column with Decimal(0)
df['pnl'] = [Decimal(0)] * len(df)

# Loop through the DataFrame using iterrows
for i, row in df.iterrows():
    if i == 0:  # Handle the first row
        df.loc[i, 'pnl'] = row['trade'] * row['basis']
    else:  # Calculate pnl for subsequent rows
        df.loc[i, 'pnl'] = df.loc[i-1, 'pnl'] + (row['trade'] * row['basis'])

# Print the resulting DataFrame
print(df)
