import pandas as pd
import numpy as np
from decimal import Decimal

# Create a sample DataFrame similar to your data
df = pd.read_csv('debug.csv')

# Define the Decimal-based calculation with NaN handling
def calc_funding(row):
    if pd.isna(row['position']) or pd.isna(row['markPrice']) or pd.isna(row['fundingRate']):
        return np.nan  # Preserve NaNs where data’s missing
    return float(Decimal(str(row['markPrice'])) * Decimal(str(row['position'])) * Decimal(str(row['fundingRate'])))

# Apply the calculation to the DataFrame
df['funding_fee'] = df.apply(calc_funding, axis=1)

# Print the results
print("Original Data with Funding Fee:")
print(df)

# Compare to the broken float version for demonstration
df['funding_fee_float'] = df.apply(lambda row: row['markPrice'] * row['position'] * row['fundingRate'], axis=1)
print("\nFloat-Based Calculation (for comparison):")
print(df[['position', 'markPrice', 'fundingRate', 'funding_fee_float']])