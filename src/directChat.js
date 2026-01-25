import { getUserState, setUserState, setUserCert, getAllCerts } from './model/user.js'
import { STATE_WAIT_PUBKEY, STATE_NOSTATE, STATE_WAIT_CONTENT, STATE_WAIT_SIG } from './model/const.js'
import { checkSig, isCertFile, isSigFile } from './helpers.js'
import { getFile } from './api/file.js'
import { sendMessage, sendDocument } from './api/message.js'

export const handleCmd = async (command, message, botToken) => {
    const userId = message.from.id;

    switch (command) {
        case '/start':
        case '/set_pubkey':
            await setUserState(userId, STATE_WAIT_PUBKEY);
            sendMessage(botToken, userId, undefined, 'Pubkey ->');
            break;
         case '/verify':
            await setUserState(userId, STATE_WAIT_CONTENT);
            sendMessage(botToken, userId, undefined, 'Content ->');
            break;
        case '/state':
            sendMessage(botToken, userId, undefined, (await getUserState(userId)).value);
            break;
         case '/clear':
            await setUserState(userId, STATE_NOSTATE);
            sendMessage(botToken, userId, undefined, 'OK');
            break;
         default:
            sendMessage(botToken, userId, undefined, 'unknown command');
    }
}

export const handleState = async (message, botToken) => {
    const userId = message.from.id;
    const userState = await getUserState(userId);
    const document = message.document;

    switch (userState.value) {
        case STATE_WAIT_PUBKEY:
            if (isCertFile(document)) {
                const file = await getFile(botToken, document.file_id);
                await setUserCert(userId, file.toString());
                
                sendMessage(botToken, userId, undefined, "pubkey saved")
                sendDocument(botToken, process.env.CA_CHAT_ID, process.env.CA_TOPIC_ID, document.file_id, `@${message.from.username}`)
                await setUserState(userId, STATE_NOSTATE);
            } else {
                sendMessage(botToken, userId, undefined, 'pubkey expected');
            }
            break;
         case STATE_WAIT_CONTENT:
            if (!message.text) {
                return sendMessage(botToken, userId, undefined, 'text content expected')
            }

            await setUserState(userId, STATE_WAIT_SIG, message.text);
            sendMessage(botToken, userId, undefined, 'Sig ->');
            break;
         case STATE_WAIT_SIG:
            if (isSigFile(document)) {
                const sigFile = await getFile(botToken, document.file_id);
                
                const pubkeys = await getAllCerts();

                if (await checkSig(userState.data, sigFile, pubkeys)) {
                    sendMessage(botToken, userId, undefined, "sig correct")
                } else {
                    sendMessage(botToken, userId, undefined, "sig incorrect")
                }
                
                await setUserState(userId, STATE_NOSTATE);
            } else {
                sendMessage(botToken, userId, undefined, 'sig expected');
            }
            break;
         default:
            sendMessage(botToken, userId, undefined, 'Use cmd');
    }
}
