import { Telegraf, Context, Markup } from "telegraf";
import getUser from "../helpers/user";
import { fetchRate } from "../helpers/payment";

const welcomeMessage = async (ctx: Context, isReturn = false) => {
  const telegram_id = ctx.from?.id || 0;
  const user = await getUser(telegram_id);

  const firstName = ctx.from?.first_name || "there";
  const isNewUser = !user;

  const rate = await fetchRate({
    token: "USDT",
    currency: "NGN",
  });

  let message = "";

  if (isReturn) {
    message = `🚀 Welcome back, ${firstName}!\n\n`;
  } else if (isNewUser) {
    message = `🎉 Hello ${firstName}! Welcome to P2P Crypto Bot!\n\n`;
  } else {
    message = `👋 Hey ${firstName}! Good to see you again!\n\n`;
  }

  message += `💰 Your gateway to seamless crypto-fiat trading:\n\n`;
  message += `🟢 **Buy Crypto** - Purchase crypto with your local currency\n`;
  message += `🔴 **Sell Crypto** - Convert crypto to fiat instantly\n`;
  message += `📊 **Track Stats** - Monitor your trading activity\n`;
  message += `✅ **Get Verified** - Add your bank details to start trading\n\n`;
  message += `The Current Rate is ₦${rate.data || "N/A"} per $1 USDT\n\n`;
  message += `Ready to start trading? Choose an option below:`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback("🟢 Buy Crypto", "buy"),
      Markup.button.callback("🔴 Sell Crypto", "sell"),
    ],
    [
      Markup.button.callback("📊 My Stats", "stats"),
      Markup.button.callback("✅ Verify Account", "verify"),
    ],
    [Markup.button.callback("❓ Help", "help")],
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
};

const startCommand = (bot: Telegraf<Context>) => {
  bot.start(async (ctx) => {
    await welcomeMessage(ctx, false);
  });

  // Handle return to main menu
  bot.action("main_menu", async (ctx) => {
    await ctx.answerCbQuery();
    await welcomeMessage(ctx, true);
  });
};

export default startCommand;
