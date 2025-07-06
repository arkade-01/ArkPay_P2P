import mongoose from "mongoose";
import config from "./config";

// Use the url from the environment variable
const url = config.database.MONGO_URI;

// Create a function to connect to the database
const connectToDatabase = async () => {
  try {
    const app = await mongoose.connect(url);
    console.log("Connected to MongoDB successfully!");
    return app;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error, url);
    process.exit(1); // Exit the process with failure
  }
};

// // Call the connection function
// connectToDatabase();
export default connectToDatabase;
