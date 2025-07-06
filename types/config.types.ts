export interface Config {
  BOT_TOKEN: string;
  database: {
    MONGO_URI: string;
  }
  API : {
    URL: string;
    API_KEY: string;
  }
}