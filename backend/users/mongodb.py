from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import logging
from decouple import config

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    
    uri = "mongodb+srv://sutgJxLaXWo7gKMR:sutgJxLaXWo7gKMR@cluster0.2ytii.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    
    logger.info("Attempting to connect to MongoDB Atlas...")
    
    client = MongoClient(uri, server_api=ServerApi('1'))
    

    logger.info("Successfully connected to MongoDB Atlas!")
    

    db = client["attendance"]
    users_collection = db["students"]
    admins_collection = db["staffs"]

    #
    users_collection.create_index("email", unique=True)
    admins_collection.create_index("email", unique=True)

except Exception as e:
    logger.error("Error connecting to MongoDB Atlas: %s", str(e), exc_info=True)
    raise 