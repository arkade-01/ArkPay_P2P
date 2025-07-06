import { Telegraf, Context, Markup } from "telegraf";

async function buyMessage(ctx: Context) {

  const message = `Coming Soon.....!`;
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("Return to Main Menu", "main_menu")],
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

const buyCommand = (bot: Telegraf<Context>) => {
  bot.command("buy",async (ctx) => {
    await buyMessage(ctx);
  });

  // Handle return to main menu
  bot.action("buy", async (ctx) => {
    await ctx.answerCbQuery();
    await buyMessage(ctx);
  });
};

export default buyCommand;