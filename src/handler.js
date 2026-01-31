import { getCommand, getAsyncQueueByKey, getPublishDestinations } from './helpers.js'
import { handleMessage as directChatHandleMessage } from './directChat.js'
import { handleMessage as publicChatHandleMessage } from './publicChat.js';

const queue = getAsyncQueueByKey();
const publishDestinations = getPublishDestinations();

export const handler = (message, botInfo) => {
    const commandWithArgs = getCommand(message, botInfo);
    const isDirect = message.from.id === message.chat.id;
    const messageKey = message.chat.id + (message.message_thread_id ? `_${message.message_thread_id}` : '');

    queue(messageKey, async () => {
        if (isDirect) {
            await directChatHandleMessage(commandWithArgs, message);
        } else {
            await publicChatHandleMessage(commandWithArgs, message, publishDestinations);
        }
    });
}