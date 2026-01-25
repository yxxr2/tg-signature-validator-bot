import mongoose from "mongoose";

const messageSignatureSchema = new mongoose.Schema({
  chatId: {
    type: Number,
    index: true,
  },
  messageId: {
    type: Number,
    index: true,
  },
  signatures: [{ userId: Number, sigFileId: String }]
});


const messageSignatureModel = mongoose.model('MessageSignature', messageSignatureSchema);

export const isUserSigned = async ({ chatId, messageId }, userId) => {
  const existing = !!(await messageSignatureModel.findOne({ chatId, messageId, signatures: { $elemMatch: { userId } } }));

  return existing;
}
export const addMessageSignature = async ({ chatId, messageId }, userId, sigFileId) => {
  if (!(await isUserSigned({ chatId, messageId }, userId))) {
    const newItem = { userId, sigFileId };
    await messageSignatureModel.updateOne({ chatId, messageId }, { $push: { signatures: newItem } }, { upsert: true });
  }
}

export const removeMessageSignature = async ({ chatId, messageId }, userId) => {
  await messageSignatureModel.updateOne({ chatId, messageId }, { $pull: { signatures: { userId } } });
}
export const removeUserSignature = async (chatId, userId) => {
  await messageSignatureModel.updateOne({ chatId }, { $pull: { signatures: { userId } } });
}

export const getMessageSignatures = async ({ chatId, messageId }) => {
  return (await messageSignatureModel.findOne({ chatId, messageId }))?.signatures || [];
}
export const setMessageSignatures = async ({ chatId, messageId }, signatures) => {
  await messageSignatureModel.updateOne({ chatId, messageId }, { signatures }, { upsert: true });
}
