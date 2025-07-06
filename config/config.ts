import { Config } from "../types/config.types";
import dotenv from "dotenv";

dotenv.config()

const config: Config = {
  BOT_TOKEN: process.env.BOT_TOKEN || "",
  database: {
    MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/p2p_bot"
  },
  API: {
    URL: process.env.API_URL || "https://api.example.com",
    API_KEY: process.env.API_KEY || "your_api_key_here" 
  }
}

export default config;