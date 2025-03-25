# First, install the library
# pip install python-dotenv

from dotenv import load_dotenv
import os

# Load the .env file
load_dotenv()

# url = "http://35.223.47.48:8086"
INFLUX_URL = os.getenv("INFLUX_URL")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN")
INFLUX_ORG = "organization"