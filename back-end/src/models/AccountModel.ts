import mongoose, { Document, Schema } from "mongoose";

export interface IAccount {
  username: string;
  password: string;
  isAdmin: string;
  token: number;
}

export interface IAccountModel extends IAccount, Document {}

const AccountSchema: Schema = new Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    isAdmin: { type: String, required: true },
    token: { type: Number, required: true },
  },
  {
    versionKey: false,
  }
);

export default mongoose.model<IAccountModel>('Account',AccountSchema);
