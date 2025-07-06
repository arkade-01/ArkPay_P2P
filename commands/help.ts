import { Telegraf, Context, Markup } from "telegraf";

const helpMessage = async ( ctx: Context) => {
  const message = `
    Reach out to @arkade\\_01 if you need help
  `
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback("Return to Main Menu", "main_menu")
    ],
  ]);

  try {
    await ctx.reply(message, {
      parse_mode: "Markdown",
      ...keyboard,
    });
  } catch (error) {
    console.error("Error sending welcome message:", error);
    // Fallback without markdown if parsing fails
    await ctx.reply(message.replace(/[*_`]/g, ""), keyboard);
  }
  
}

const helpCommand = (bot: Telegraf<Context>) => {
  bot.help(async (ctx) => {
    await helpMessage(ctx)
  })

  bot.action("help", async(ctx) => {
    await helpMessage(ctx)
  })
}

export default helpCommand;