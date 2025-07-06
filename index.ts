import { Telegraf } from "telegraf";
import config from "./config/config";
import connectToDatabase from "./config/dbConfig";
import { readdirSync } from "fs";
import { join } from "path";

const startBot = async () => {
  //Connect to the database
  await connectToDatabase();

  const bot = new Telegraf(config.BOT_TOKEN);

  // Load and register all commands
  const commandsPath = join(__dirname, "commands");
  const commandFiles = readdirSync(commandsPath).filter(
    (file) => file.endsWith(".ts") || file.endsWith(".js")
  );

  for (const file of commandFiles) {
    const command = require(join(commandsPath, file)).default;
    if (typeof command === "function") {
      command(bot);
    }
  }

  bot.launch();
  console.log("Bot is running...");

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

startBot();