import mongoose from "mongoose";
import { STATE_NOSTATE } from "./const.js";

const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    unique: true,
    index: true,
    required: true,
  },
  certs: [{ data: String }],
  state: {
    type: {
        value: String,
        data: mongoose.Schema.Types.Mixed,
    },
    default: { value: STATE_NOSTATE },
  }
});

const userModel = mongoose.model('User', userSchema);

export const setUserCert = async (userId, certData) => {
    await userModel.updateOne({ userId }, { certs: [{ data: certData }] }, { upsert: true }).exec();
}
export const getUserCert = async (userId) => {
    return (await userModel.findOne({ userId }).exec())?.certs?.[0].data;
}
export const getAllCerts = async () => {
    return (await userModel.find({}, 'certs').exec()).map(({ certs }) => certs?.[0].data).filter(Boolean);
}

export const getUserState = async (userId) => (await userModel.findOne({ userId }).exec())?.state || { value: STATE_NOSTATE };
export const setUserState = async (userId, newValue, data = null) => {
    const state = { value: newValue, data };
    await userModel.updateOne({ userId }, { state }, { upsert: true }).exec();
};
export const updateUserStateCustom = async (userId, rules) => {
    await userModel.updateOne({ userId }, rules).exec();
};
