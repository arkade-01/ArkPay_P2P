export interface User {
  telegram_id: number;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  institutionCode?: string;
  walletAddress?: string;
  tradeVolume?: number;
  tradeCount?: number;
}