import { Telegraf, Context, Markup } from "telegraf";
import getUser from "../helpers/user";
import { createOrder, fetchRate } from "../helpers/payment";

// Enhanced session storage for sell transactions
const sellSessions = new Map<
  number,
  {
    step: "waiting_refund_address" | "waiting_amount" | "confirming";
    token: "USDT" | "USDC";
    chain: string;
    chainName: string;
    refundAddress?: string;
    amount?: number;
    rate?: number;
    receivingAmount?: number;
  }
>();

const sellMessage = async (ctx: Context) => {
  const telegram_id = ctx.from?.id || 0;
  const user = await getUser(telegram_id);

  if (!user?.accountNumber) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("✅ Verify Account", "verify")],
      [Markup.button.callback("Return to Main Menu", "main_menu")],
    ]);

    await ctx.reply("You need to set your account number to trade", {
      parse_mode: "Markdown",
      ...keyboard,
    });
  } else {
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("💰 Sell USDT", "sell_usdt"),
        Markup.button.callback("💰 Sell USDC", "sell_usdc"),
      ],
      [Markup.button.callback("Return to Main Menu", "main_menu")],
    ]);

    await ctx.reply(
      `🔴 **Sell Crypto**\n\n` +
        `Ready to convert your crypto to fiat? Just follow these steps:\n\n` +
        `1️⃣ **Select Crypto**: Choose the cryptocurrency you want to sell (USDC & USDT supported).\n` +
        `2️⃣ **Set Amount**: Specify how much crypto you want to sell.\n` +
        `3️⃣ **Choose Payment Method**: Select how you want to receive your payment.\n` +
        `4️⃣ **Confirm Trade**: Review the details and confirm your trade.\n\n` +
        `💡 **Note**: Ensure you have sufficient crypto balance in your wallet`,
      {
        parse_mode: "Markdown",
        ...keyboard,
      }
    );
  }
};

const sellCommand = (bot: Telegraf<Context>) => {
  bot.command("sell", async (ctx) => {
    await sellMessage(ctx);
  });

  bot.action("sell", async (ctx) => {
    await ctx.answerCbQuery();
    await sellMessage(ctx);
  });

  // Handle text messages (refund address and amount input)
  bot.on("text", async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const session = sellSessions.get(userId);
    if (!session) {
      return next(); // Not in a sell session, let other handlers process this
    }

    // Only handle text if we're in a sell session
    if (session.step === "waiting_refund_address") {
      const refundAddress = ctx.message.text.trim();

      // Basic address validation (you might want to add more specific validation per chain)
      if (
        refundAddress.length < 26 ||
        !refundAddress.match(/^0x[a-fA-F0-9]{40}$/)
      ) {
        await ctx.reply(
          "❌ Invalid wallet address format. Please enter a valid wallet address:",
          Markup.inlineKeyboard([
            [
              Markup.button.callback(
                `← Back to Chain Selection`,
                `sell_${session.token.toLowerCase()}`
              ),
            ],
            [Markup.button.callback("← Back to Sell Menu", "sell")],
          ])
        );
        return;
      }

      // Update session with refund address
      session.refundAddress = refundAddress;
      session.step = "waiting_amount";
      sellSessions.set(userId, session);

      await ctx.reply(
        `✅ **Refund Address Saved**\n\n` +
          `🔒 **Refund Address**: \`${refundAddress}\`\n\n` +
          `💰 **Selling ${session.token} on ${session.chainName}**\n\n` +
          `Please enter the amount of ${session.token} you want to sell:`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(
                "🔄 Change Refund Address",
                `change_refund_${session.token.toLowerCase()}_${session.chain}`
              ),
            ],
            [Markup.button.callback("← Back to Sell Menu", "sell")],
          ]),
        }
      );
    } else if (session.step === "waiting_amount") {
      const amount = parseFloat(ctx.message.text.trim());

      if (isNaN(amount) || amount <= 0) {
        await ctx.reply(
          "❌ Invalid amount. Please enter a valid number:",
          Markup.inlineKeyboard([
            [Markup.button.callback("← Back to Sell Menu", "sell")],
          ])
        );
        return;
      }

      const rate = await fetchRate({
        token: session.token,
      });

      const receivingAmount = rate.data * amount;

      // Update session with amount, rate and receiving amount
      session.amount = amount;
      session.rate = rate.data;
      session.receivingAmount = receivingAmount;
      session.step = "confirming";
      sellSessions.set(userId, session);

      // Display trade summary
      await ctx.reply(
        `📋 **Trade Summary**\n\n` +
          `💰 **Token**: ${session.token}\n` +
          `⛓️ **Chain**: ${session.chainName}\n` +
          `💵 **Amount**: ${amount} ${session.token}\n` +
          `🔒 **Refund Address**: \`${session.refundAddress}\`\n` +
          `💵 **Rate**: ${rate.data}\n` +
          `💵 **Receiving Amount**: ${receivingAmount}\n\n` +
          `Please confirm this trade:`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback("✅ Confirm Trade", "confirm_sell"),
              Markup.button.callback("❌ Cancel", "cancel_sell"),
            ],
            [Markup.button.callback("← Back to Sell Menu", "sell")],
          ]),
        }
      );
    }
  });

  // Handle refund address change
  bot.action(/^change_refund_(.+)_(.+)$/, async (ctx) => {
    const token = ctx.match[1].toUpperCase() as "USDT" | "USDC";
    const chain = ctx.match[2];

    await ctx.answerCbQuery("Change refund address");

    // Trigger the chain selection again
    await ctx.reply("Please enter a new refund address:");

    const userId = ctx.from?.id;
    if (userId) {
      const session = sellSessions.get(userId);
      if (session) {
        session.step = "waiting_refund_address";
        sellSessions.set(userId, session);
      }
    }
  });

  // Handle crypto selection
  bot.action("sell_usdt", async (ctx) => {
    await ctx.answerCbQuery("Selected USDT");

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("🟡 BSC", "sell_usdt_bnb-smart-chain"),
        Markup.button.callback("🟣 Polygon", "sell_usdt_polygon"),
      ],
      [Markup.button.callback("🔵 Arbitrum", "sell_usdt_arbitrum-one")],
      [
        Markup.button.callback("← Back to Sell Menu", "sell"),
        Markup.button.callback("Return to Main Menu", "main_menu"),
      ],
    ]);

    await ctx.reply(
      "💰 **Selling USDT**\n\n" + "Please select the blockchain network:",
      keyboard
    );
  });

  bot.action("sell_usdc", async (ctx) => {
    await ctx.answerCbQuery("Selected USDC");

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("🔵 Base", "sell_usdc_base"),
        Markup.button.callback("🟡 BSC", "sell_usdc_bnb-smart-chain"),
      ],
      [
        Markup.button.callback("🟣 Polygon", "sell_usdc_polygon"),
        Markup.button.callback("🔵 Arbitrum", "sell_usdc_arbitrum-one"),
      ],
      [
        Markup.button.callback("← Back to Sell Menu", "sell"),
        Markup.button.callback("Return to Main Menu", "main_menu"),
      ],
    ]);

    await ctx.reply(
      "💰 **Selling USDC**\n\n" + "Please select the blockchain network:",
      keyboard
    );
  });

  // Handle USDT chain selection
  bot.action(/^sell_usdt_(.+)$/, async (ctx) => {
    const chain = ctx.match[1];
    let chainName = "";

    switch (chain) {
      case "bnb-smart-chain":
        chainName = "BSC";
        break;
      case "polygon":
        chainName = "Polygon";
        break;
      case "arbitrum-one":
        await ctx.answerCbQuery("Chain not supported");
        await ctx.reply(
          "❌ This chain is currently not supported for USDT",
          Markup.inlineKeyboard([
            [Markup.button.callback("← Back to Chain Selection", "sell_usdc")],
            [Markup.button.callback("← Back to Sell Menu", "sell")],
          ])
        );
        return;
    }

    await ctx.answerCbQuery(`Selected USDT on ${chainName}`);

    // Store session data
    const userId = ctx.from?.id;
    if (userId) {
      sellSessions.set(userId, {
        step: "waiting_refund_address",
        token: "USDT",
        chain: chain,
        chainName: chainName,
      });
    }

    await ctx.reply(
      `💰 **Selling USDT on ${chainName}**\n\n` +
        `🔒 **Refund Address Required**\n\n` +
        `Please enter your ${chainName} wallet address for refunds in case the transaction fails.\n\n` +
        `⚠️ **Important**: Make sure this is a valid ${chainName} address that supports USDT.`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("← Back to Chain Selection", "sell_usdt")],
          [Markup.button.callback("← Back to Sell Menu", "sell")],
          [Markup.button.callback("Return to Main Menu", "main_menu")],
        ]),
      }
    );
  });

  // Handle USDC chain selection
  bot.action(/^sell_usdc_(.+)$/, async (ctx) => {
    const chain = ctx.match[1];
    let chainName = "";

    switch (chain) {
      case "base":
        chainName = "Base";
        break;
      case "bnb-smart-chain":
        await ctx.answerCbQuery("Chain not supported");
        await ctx.reply(
          "❌ This chain is currently not supported for USDC",
          Markup.inlineKeyboard([
            [Markup.button.callback("← Back to Chain Selection", "sell_usdc")],
            [Markup.button.callback("← Back to Sell Menu", "sell")],
          ])
        );
        return;
      case "polygon":
        chainName = "Polygon";
        break;
      case "arbitrum-one":
        await ctx.answerCbQuery("Chain not supported");
        await ctx.reply(
          "❌ This chain is currently not supported for USDC",
          Markup.inlineKeyboard([
            [Markup.button.callback("← Back to Chain Selection", "sell_usdc")],
            [Markup.button.callback("← Back to Sell Menu", "sell")],
          ])
        );
        return;
    }

    await ctx.answerCbQuery(`Selected USDC on ${chainName}`);

    // Store session data
    const userId = ctx.from?.id;
    if (userId) {
      sellSessions.set(userId, {
        step: "waiting_refund_address",
        token: "USDC",
        chain: chain,
        chainName: chainName,
      });
    }

    await ctx.reply(
      `💰 **Selling USDC on ${chainName}**\n\n` +
        `🔒 **Refund Address Required**\n\n` +
        `Please enter your ${chainName} wallet address for refunds in case the transaction fails.\n\n` +
        `⚠️ **Important**: Make sure this is a valid ${chainName} address that supports USDC.`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("← Back to Chain Selection", "sell_usdc")],
          [Markup.button.callback("← Back to Sell Menu", "sell")],
          [Markup.button.callback("Return to Main Menu", "main_menu")],
        ]),
      }
    );
  });

  // Handle sell confirmation
  bot.action("confirm_sell", async (ctx) => {
    await ctx.answerCbQuery("Processing your sell order...");

    const telegram_id = ctx.from?.id;
    if (!telegram_id) {
      await ctx.reply("❌ Error: Unable to identify user");
      return;
    }

    const user = await getUser(telegram_id);
    const session = sellSessions.get(telegram_id);

    if (
      !session ||
      !session.amount ||
      !session.rate ||
      !session.refundAddress
    ) {
      await ctx.reply(
        "❌ Error: Session expired. Please start over.",
        Markup.inlineKeyboard([
          [Markup.button.callback("← Back to Sell Menu", "sell")],
        ])
      );
      return;
    }

    if (!user?.accountNumber) {
      await ctx.reply(
        "❌ Error: Account not verified. Please verify your account first.",
        Markup.inlineKeyboard([
          [Markup.button.callback("✅ Verify Account", "verify")],
        ])
      );
      return;
    }

    try {
      const orderResponse = await createOrder({
        amount: session.amount,
        rate: Number(session.rate),
        network: session.chain,
        token: session.token,
        recipient: {
          institution: user.institutionCode || "",
          accountIdentifier: user.accountNumber.toString() || "",
          accountName: user.accountName || "",
          memo: `Sell ${session.token} on ${session.chainName}`,
        },
        returnAddress: session.refundAddress,
        reference: `sell-${Date.now()}`,
      });

      await user.updateOne(
        { telegram_id: telegram_id },
        {
          $inc: { 
            tradeVolume: Number(session.amount),
            totalTrades: 1 
          },
        }
      )
        

      // Clear session after successful order creation
      sellSessions.delete(telegram_id);

      // Format the expiration time for better readability
      const validUntil = new Date(orderResponse.validUntil);
      const expiresIn = Math.ceil(
        (validUntil.getTime() - Date.now()) / (1000 * 60)
      ); // minutes

      await ctx.reply(
        `✅ **Sell Order Created Successfully!**\n\n` +
          `📋 **Order Details:**\n` +
          `🆔 **Order ID**: \`${orderResponse.id}\`\n` +
          `💰 **Token**: ${session.token}\n` +
          `⛓️ **Chain**: ${session.chainName}\n` +
          `💵 **Amount to Send**: ${orderResponse.amount} ${session.token}\n` +
          `💵 **You'll Receive**: ${session.receivingAmount}\n` +
          `💰 **Sender Fee**: ${orderResponse.senderFee} ${session.token}\n` +
          `⚡ **Network Fee**: ${orderResponse.transactionFee} ${session.token}\n\n` +
          `🏦 **Deposit Instructions:**\n` +
          `📍 **Send To**: \`${orderResponse.receiveAddress}\`\n` +
          `⏰ **Expires In**: ${expiresIn} minutes\n` +
          `🔒 **Reference**: \`${orderResponse.reference}\`\n\n` +
          `⚠️ **Important:**\n` +
          `• Send EXACTLY ${orderResponse.amount} ${session.token}\n` +
          `• Use ${session.chainName} network only\n` +
          `• Complete before expiration time\n` +
          `• Save this information for your records`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(
                "📋 Copy Address",
                `copy_address_${orderResponse.id}`
              ),
              Markup.button.callback(
                "📊 Track Order",
                `track_${orderResponse.id}`
              ),
            ],
            [Markup.button.callback("🏠 Main Menu", "main_menu")],
          ]),
        }
      );
    } catch (error) {
      console.error("Error creating sell order:", error);
      await ctx.reply(
        "❌ **Order Creation Failed**\n\n" +
          "There was an error processing your sell order. Please try again later.",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Try Again", "sell")],
          [Markup.button.callback("🏠 Main Menu", "main_menu")],
        ])
      );
    }
  });

  // Handle sell cancellation
  bot.action("cancel_sell", async (ctx) => {
    await ctx.answerCbQuery("Order cancelled");

    const telegram_id = ctx.from?.id;
    if (telegram_id) {
      sellSessions.delete(telegram_id);
    }

    await ctx.reply(
      "❌ **Order Cancelled**\n\n" + "Your sell order has been cancelled.",
      Markup.inlineKeyboard([
        [Markup.button.callback("💰 New Sell Order", "sell")],
        [Markup.button.callback("🏠 Main Menu", "main_menu")],
      ])
    );
  });
};

export default sellCommand;
