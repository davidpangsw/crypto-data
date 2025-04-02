import logging 
import traceback
from influxdb_client import InfluxDBClient
from repository.repository import Repository
from config.influx import INFLUX_URL, INFLUX_TOKEN, INFLUX_ORG
from strategy import basic_funding_arbitrage

# Configure basic logging
logging.basicConfig(level=logging.INFO)

# Create a logger
logger = logging.getLogger(__name__)

# Log some messages
logger.critical("This is a critical message")
logger.error("This is an error message")
logger.warning("This is a warning message")
logger.info("This is an info message")
logger.debug("This is a debug message")


# Initialize the client
symbol = "ALTUSDT"
bucket_prefix = "bitget"
client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
repo = Repository(client, bucket_prefix)

try:
    start = -72
    end = start + 1 * 24
    basic_funding_arbitrage.analyse(repo, symbol, f"{start}h", f"{end}h")
except Exception as e:
    print(f"Error occurred: {e}")
    traceback.print_exc()
finally:
    # Close the client
    client.close()
