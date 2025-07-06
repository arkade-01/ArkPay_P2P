export type RatePayload = {
  token: string;
  amount?: number;
  currency?: string;
  providerId?: string;
};

export type RateResponse = {
  status: string;
  data: number;
  message: string;
};

export type InstitutionProps = {
  name: string;
  code: string;
  type: "bank" | "mobile_money";
};

export type VerifyAccountPayload = {
  institution: string;
  accountIdentifier: string;
};

export type Recipient = {
  institution: string;
  accountIdentifier: string;
  accountName: string;
  memo: string;
};

export type  OrderPayload = {
  amount: number;
  rate: number;
  network: string;
  token: string;
  recipient: Recipient;
  returnAddress: string;
  reference?: string;
  feePercent?: number;
  feeAddress?: string;
};

export type OrderResponse = {
  id: string;
  amount: string;
  token: string;
  network: string;
  receiveAddress: string;
  validUntil: string;
  senderFee: string;
  transactionFee: string;
  reference: string;
};
