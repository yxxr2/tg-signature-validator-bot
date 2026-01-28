import { getCommand, getAsyncQueueByKey } from './helpers.js'
import { handleMessage as directChatHandleMessage } from './directChat.js'
import { handleMessage as publicChatHandleMessage } from './publicChat.js';

const queue = getAsyncQueueByKey();

export const handler = (message, botInfo) => {
    const command = getCommand(message, botInfo);
    const isDirect = message.from.id === message.chat.id;
    const messageKey = message.chat.id + (message.message_thread_id ? `_${message.message_thread_id}` : '');

    queue(messageKey, async () => {
        if (isDirect) {
            await directChatHandleMessage(command, message);
        } else {
            await publicChatHandleMessage(command, message);
        }
    });
}