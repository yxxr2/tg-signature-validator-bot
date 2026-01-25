import { getCommand } from './helpers.js'
import { handleMessage as directChatHandleMessage } from './directChat.js'
import { handleMessage as publicChatHandleMessage } from './publicChat.js';

export const handler = (message, botToken) => {
    const command = getCommand(message);
    const isDirect = message.from.id === message.chat.id;

    if (isDirect) {
        directChatHandleMessage(command, message, botToken);
    } else {
        publicChatHandleMessage(command, message, botToken);
    }
}