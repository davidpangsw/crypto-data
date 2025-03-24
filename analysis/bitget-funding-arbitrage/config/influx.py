# First, install the library
# pip install python-dotenv

from dotenv import load_dotenv
import os

# Load the .env file
load_dotenv()

# Access environment variables
my_variable = os.getenv("MY_VARIABLE")
print(my_variable)

# Example with a default value if variable isn't found
database_url = os.getenv("DATABASE_URL", "default_url_here")
print(database_url)