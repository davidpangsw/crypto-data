import pandas as pd
from io import StringIO

# Example CSV string (replace this with reading from your actual file)
csv_data = """
_time,lastPr_future,lastPr_spot,markPrice,fundingRate,fundingRate_future
2025-03-19 01:34:20.193000+00:00,0.03649,,0.0365,,5e-05
2025-03-19 01:34:20.728000+00:00,0.03649,0.0365,0.03647,,5e-05
2025-03-25 11:13:01+00:00,0.03907,0.03907,0.03906,,5e-05
"""

# Read the CSV data into a DataFrame
df = pd.read_csv(StringIO(csv_data))
# df = pd.read_csv(StringIO(csv_data), parse_dates=['_time']) # this DOES NOT work
df['_time'] = pd.to_datetime(df['_time'], format='ISO8601')

print("Before timezone removal:")
print(df['_time'].dtype)  # Should be datetime64[ns, UTC] or similar
print(df)


# Remove timezone to make it naive (Excel-compatible)
df['_time'] = df['_time'].dt.tz_localize(None)

print("\nAfter timezone removal:")
print(df['_time'].dtype)  # Should be datetime64[ns]
print(df)

# Optional: Write to Excel
df.to_excel('output.xlsx', index=False)