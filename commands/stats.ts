import { Telegraf, Context, Markup } from "telegraf";
import getUser from "../helpers/user";

const myStats = async (ctx: Context) => {
  const telegram_id = ctx.from?.id || 0;
  const user = await getUser(telegram_id);

  const message = ` Check out your trading Stats Since you got here\n

    📈 Your Stats: ${user?.tradeCount} trades completed | $${
      user?.tradeVolume?.toFixed(2) || "0.00"
    } total volume\n\n
  `

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback("Return to Main Menu", "main_menu")
    ]
  ])

  try {
    await ctx.reply(message, {
      parse_mode: "Markdown",
      ...keyboard
    })
  } catch (error) {
    console.error("Error sending welcome message:", error);
    // Fallback without markdown if parsing fails
    await ctx.reply(message.replace(/[*_`]/g, ""), keyboard);
  }
}

const statsCommand = (bot: Telegraf<Context>) => {
  bot.command("stats", async(ctx) => {
    await myStats(ctx)
  })

  bot.action("stats", async(ctx) => {
    await myStats(ctx)
  })
}

export default statsCommand;