import { Telegraf, Context, Markup } from "telegraf";
import getUser from "../helpers/user";
import { getInstitutions, fetchAccountName } from "../helpers/payment";
import { InstitutionProps, VerifyAccountPayload } from "../types/payment.types";
import { UserModel } from "../models/user";

// Simple session storage (in production, use a proper session management library)
const userSessions = new Map<
  number,
  {
    step: "waiting_account_number" | "waiting_confirmation";
    selectedBank: InstitutionProps;
    accountNumber?: string;
    accountName?: string;
  }
>();

const verifyMessage = async (ctx: Context) => {
  const telegram_id = ctx.from?.id || 0;
  const user = await getUser(telegram_id);

  const message = `✅ Verify Your Account to Start Trading\n\n**Bank Name**: ${
    user?.bankName ? user.bankName : "Not Set"
  }\n**Account Name**: ${
    user?.accountName ? user.accountName : "Not Set"
  }\n**Account Number**: ${
    user?.accountNumber ? user.accountNumber : "Not Set"
  }\n\nAdd your account to Start trading!!`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback("Add Account", "ver_acc"),
      Markup.button.callback("Remove Account", "rem_acc"),
    ],
    [Markup.button.callback("Return to Main Menu", "main_menu")],
  ]);

  try {
    await ctx.reply(message, {
      parse_mode: "Markdown",
      ...keyboard,
    });
  } catch (error) {
    console.error("Error sending verify message:", error);
    // Fallback without markdown if parsing fails
    await ctx.reply(message.replace(/[*_`]/g, ""), keyboard);
  }
};

const showBankSelection = async (
  ctx: Context,
  page: number = 0,
  edit: boolean = false
) => {
  try {
    if (!edit) {
      await ctx.answerCbQuery("Loading banks...");
    }

    // Fetch institutions for Nigerian Naira (NGN) - should return Institution[]
    const institutions = await getInstitutions("NGN");

    if (!institutions || institutions.length === 0) {
      const errorMessage =
        "❌ No banks available at the moment. Please try again later.";
      const errorKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback("Return to Verify", "verify")],
      ]);

      if (edit) {
        await ctx.editMessageText(errorMessage, errorKeyboard);
      } else {
        await ctx.reply(errorMessage, errorKeyboard);
      }
      return;
    }

    // Pagination settings
    const banksPerPage = 8; // Show 8 banks per page (4 rows of 2)
    const totalPages = Math.ceil(institutions.length / banksPerPage);
    const startIndex = page * banksPerPage;
    const endIndex = Math.min(startIndex + banksPerPage, institutions.length);
    const currentPageBanks = institutions.slice(startIndex, endIndex);

    // Create keyboard with banks (max 2 buttons per row)
    const bankButtons = [];
    for (let i = 0; i < currentPageBanks.length; i += 2) {
      const row = [];

      // Add first bank in the row
      row.push(
        Markup.button.callback(
          currentPageBanks[i].name.length > 20
            ? currentPageBanks[i].name.substring(0, 20) + "..."
            : currentPageBanks[i].name,
          `select_bank_${currentPageBanks[i].code}`
        )
      );

      // Add second bank in the row if it exists
      if (i + 1 < currentPageBanks.length) {
        row.push(
          Markup.button.callback(
            currentPageBanks[i + 1].name.length > 20
              ? currentPageBanks[i + 1].name.substring(0, 20) + "..."
              : currentPageBanks[i + 1].name,
            `select_bank_${currentPageBanks[i + 1].code}`
          )
        );
      }

      bankButtons.push(row);
    }

    // Add navigation buttons if there are multiple pages
    if (totalPages > 1) {
      const navRow = [];

      if (page > 0) {
        navRow.push(
          Markup.button.callback("⬅️ Previous", `banks_page_${page - 1}`)
        );
      }

      // Page indicator
      navRow.push(
        Markup.button.callback(`${page + 1}/${totalPages}`, "page_info")
      );

      if (page < totalPages - 1) {
        navRow.push(
          Markup.button.callback("Next ➡️", `banks_page_${page + 1}`)
        );
      }

      bankButtons.push(navRow);
    }

    // Add back button
    bankButtons.push([Markup.button.callback("← Back to Verify", "verify")]);

    const keyboard = Markup.inlineKeyboard(bankButtons);

    const message = `🏦 Select your bank from the list below:\n\nPage ${
      page + 1
    } of ${totalPages} (${institutions.length} banks total)`;

    if (edit) {
      await ctx.editMessageText(message, keyboard);
      await ctx.answerCbQuery(`Page ${page + 1} of ${totalPages}`);
    } else {
      await ctx.reply(message, keyboard);
    }
  } catch (error) {
    console.error("Error fetching banks:", error);
    const errorMessage = "❌ Failed to load banks. Please try again later.";
    const errorKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback("Try Again", "ver_acc")],
      [Markup.button.callback("Return to Verify", "verify")],
    ]);

    if (edit) {
      await ctx.editMessageText(errorMessage, errorKeyboard);
    } else {
      await ctx.reply(errorMessage, errorKeyboard);
    }
  }
};

const verifyCommand = (bot: Telegraf<Context>) => {
  bot.command("verify", async (ctx) => {
    await verifyMessage(ctx);
  });

  bot.action("verify", async (ctx) => {
    await ctx.answerCbQuery();
    await verifyMessage(ctx);
  });

  bot.action("ver_acc", async (ctx) => {
    await showBankSelection(ctx, 0, false); // Start from page 0, don't edit
  });

  // Handle pagination - now edits the message
  bot.action(/^banks_page_(\d+)$/, async (ctx) => {
    const page = parseInt(ctx.match[1]);
    await showBankSelection(ctx, page, true); // Edit the existing message
  });

  // Handle page info button (does nothing, just shows current page)
  bot.action("page_info", async (ctx) => {
    await ctx.answerCbQuery("Page information");
  });

  // Handle text messages (account number input)
  bot.on("text", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const session = userSessions.get(userId);
    if (!session || session.step !== "waiting_account_number") {
      return; // Not waiting for account number from this user
    }

    const accountNumber = ctx.message.text.trim();

    // Validate account number format (10 digits for most Nigerian banks)
    if (!/^\d{10}$/.test(accountNumber)) {
      await ctx.reply(
        "❌ Invalid account number format. Please enter a valid 10-digit account number:",
        Markup.inlineKeyboard([
          [Markup.button.callback("← Change Bank", "ver_acc")],
          [Markup.button.callback("← Back to Verify", "verify")],
        ])
      );
      return;
    }

    // Show loading message
    const loadingMsg = await ctx.reply("🔍 Verifying account details...");

    try {
      // Fetch account name using the API
      const payload: VerifyAccountPayload = {
        institution: session.selectedBank.code,
        accountIdentifier: accountNumber,
      };

      const accountName = await fetchAccountName(payload);

      // Update session with account details
      session.accountNumber = accountNumber;
      session.accountName = accountName;
      session.step = "waiting_confirmation";
      userSessions.set(userId, session);

      // Delete loading message
      await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});

      // Show confirmation
      await ctx.reply(
        `✅ Account Verified!\n\n` +
          `🏦 **Bank**: ${session.selectedBank.name}\n` +
          `🔢 **Account Number**: ${accountNumber}\n` +
          `👤 **Account Name**: ${accountName}\n\n` +
          `Is this information correct?`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback("✅ Confirm & Save", "confirm_account"),
              Markup.button.callback("❌ Cancel", "cancel_verification"),
            ],
            [Markup.button.callback("🔄 Try Again", "ver_acc")],
          ]),
        }
      );
    } catch (error) {
      console.error("Error verifying account:", error);

      // Delete loading message
      await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});

      await ctx.reply(
        "❌ Failed to verify account details. This could be due to:\n" +
          "• Invalid account number\n" +
          "• Bank server issues\n" +
          "• Network connectivity problems\n\n" +
          "Please double-check your account number and try again:",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Try Again", "ver_acc")],
          [Markup.button.callback("← Back to Verify", "verify")],
        ])
      );
    }
  });

  // Handle confirmation
  bot.action("confirm_account", async (ctx) => {
    await ctx.answerCbQuery();

    const userId = ctx.from?.id;
    if (!userId) return;

    const session = userSessions.get(userId);
    if (!session || session.step !== "waiting_confirmation") {
      await ctx.reply("❌ Session expired. Please start verification again.");
      return;
    }

    try {
      await UserModel.updateOne(
        { telegram_id: userId }, // Changed from telegramId to userId
        {
          $set: {
            bankName: session.selectedBank.name,
            accountName: session.accountName,
            accountNumber: session.accountNumber,
            institutionCode: session.selectedBank.code,
          },
        },
        { upsert: true } // This will create the document if it doesn't exist
      );

      await ctx.reply(
        "🎉 Account successfully added!\n\n" +
          `Your ${session.selectedBank.name} account has been verified and saved. ` +
          "You can now start trading!",
        Markup.inlineKeyboard([
          [Markup.button.callback("🚀 Start Trading", "main_menu")],
          [Markup.button.callback("📊 View My Stats", "stats")],
        ])
      );

      // Clear session
      userSessions.delete(userId);
    } catch (error) {
      console.error("Error saving account:", error);
      await ctx.reply(
        "❌ Failed to save account details. Please try again later.",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Try Again", "confirm_account")],
          [Markup.button.callback("← Back to Verify", "verify")],
        ])
      );
    }
  });

  // Handle cancellation
  bot.action("cancel_verification", async (ctx) => {
    await ctx.answerCbQuery();

    const userId = ctx.from?.id;
    if (userId) {
      userSessions.delete(userId);
    }

    await ctx.reply(
      "❌ Account verification cancelled.",
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Start Over", "ver_acc")],
        [Markup.button.callback("← Back to Verify", "verify")],
      ])
    );
  });

  bot.action("rem_acc", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      "Feature coming soon! Contact support to remove your account."
    );
  });

  // Handle bank selection
  bot.action(/^select_bank_(.+)$/, async (ctx) => {
    const bankCode = ctx.match[1];

    try {
      const institutions = await getInstitutions("NGN");
      const selectedBank = institutions.find((bank) => bank.code === bankCode);

      if (!selectedBank) {
        await ctx.answerCbQuery("❌ Bank not found");
        return;
      }

      await ctx.answerCbQuery(`Selected: ${selectedBank.name}`);

      // Store the selected bank in session
      const userId = ctx.from?.id;
      if (userId) {
        userSessions.set(userId, {
          step: "waiting_account_number",
          selectedBank: selectedBank,
        });
      }

      await ctx.reply(
        `🏦 Selected Bank: **${selectedBank.name}**\n\n` +
          `Please enter your 10-digit account number for ${selectedBank.name}:`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("← Change Bank", "ver_acc")],
            [Markup.button.callback("← Back to Verify", "verify")],
          ]),
        }
      );
    } catch (error) {
      console.error("Error processing bank selection:", error);
      await ctx.answerCbQuery("❌ Error processing selection");
    }
  });
};

export default verifyCommand;
