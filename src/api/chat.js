import { makeApiCall } from './helpers.js'

export const getChatMemberCount = async (chatId) => makeApiCall('getChatMemberCount', { chat_id: chatId });