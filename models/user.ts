import mongoose, { Schema, Document} from "mongoose";
import { User } from "../types/user.types";

interface UserDocument extends User, Document {}

const UserSchema: Schema = new Schema({
  telegram_id: { type: Number, required: true, unique: true },
  accountNumber: { type: String},
  accountName: { type: String },
  bankName: { type: String },
  institutionCode: { type: String},
  walletAddress: { type: String },
  tradeVolume: { type: Number, default: 0 },
  tradeCount: { type: Number, default: 0 },
})

export const UserModel = mongoose.model<UserDocument>("User", UserSchema);