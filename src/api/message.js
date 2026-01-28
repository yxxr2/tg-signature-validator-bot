import { makeApiCall } from './helpers.js';

export const sendMessage = async (chatId, threadId, message, entities) => {
    return makeApiCall('sendMessage', {
        chat_id: chatId,
        ...(threadId ? { message_thread_id: threadId } : {}),
        text: message,
        ...(entities ? { entities: JSON.stringify(entities) } : {}),
    });
}

export const sendDocument = async (chatId, threadId, fileId, caption) => {
    return makeApiCall('sendDocument', {
        chat_id: chatId,
        ...(threadId ? { message_thread_id: threadId } : {}),
        document: fileId,
        caption: caption,
    });
}

export const setMessageReaction = async (chatId, messageId, emoji) => {
    return makeApiCall('setMessageReaction', {
        chat_id: chatId,
        message_id: messageId,
        reaction: JSON.stringify([{ type: 'emoji', emoji }]),
    });
}

export const sendMediaGroup = async (chatId, threadId, fileIds, replyToMessageId) => {
    return makeApiCall('sendMediaGroup', {
        chat_id: chatId,
        ...(threadId ? { message_thread_id: threadId } : {}),
        media: JSON.stringify(fileIds.map(fileId => ({ type: 'document', media: fileId }))),
        ...(replyToMessageId ? { reply_parameters: JSON.stringify({ message_id: replyToMessageId }) } : {}),
    });
}
