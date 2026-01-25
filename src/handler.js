import { getCommand } from './helpers.js'
import { handleCmd, handleState } from './directChat.js'
import { handleMessage } from './publicChat.js';

export const handler = (message, botToken) => {
    const command = getCommand(message);
    const isDirect = message.from.id === message.chat.id;

    if (isDirect) {
        if (command) {
            handleCmd(command, message, botToken);
        } else {
            handleState(message, botToken);
        }
    } else {
        handleMessage(command, message, botToken);
    }
}