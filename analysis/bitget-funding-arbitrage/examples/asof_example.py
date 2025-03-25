import pandas as pd

# Sample data
data1 = {'timestamp': ['2023-01-01 10:00:00', '2023-01-01 10:05:00',     '2023-01-01 10:10:00'],
         'value1': [10, 20, 30]}
data2 = {'timestamp': [  '2023-01-01 10:01:00', '2023-01-01 10:06:00', '2023-01-01 10:09:00'],
         'value2': [15, 25, 35]}

df1 = pd.DataFrame(data1)
df2 = pd.DataFrame(data2)

# Convert timestamp columns to datetime
df1['timestamp'] = pd.to_datetime(df1['timestamp'])
df2['timestamp'] = pd.to_datetime(df2['timestamp'])

# Sort by timestamp (required for merge_asof)
df1 = df1.sort_values('timestamp')
df2 = df2.sort_values('timestamp')

# Merge with nearest timestamp (tolerance of 2 minutes)

"""
A “backward” search selects the last row in the right DataFrame whose ‘on’ key is less than or equal to the left’s key.
A “forward” search selects the first row in the right DataFrame whose ‘on’ key is greater than or equal to the left’s key.
A “nearest” search selects the row in the right DataFrame whose ‘on’ key is closest in absolute distance to the left’s key.
"""
merged_df = pd.merge_asof(df1, df2, on='timestamp', direction='backward', tolerance=pd.Timedelta('5min'))

print(merged_df)