import { getUserState, setUserState, setUserCert, getAllCerts } from './model/user.js'
import { STATE_WAIT_PUBKEY, STATE_NOSTATE, STATE_WAIT_CONTENT, STATE_WAIT_SIG } from './model/const.js'
import { checkSig } from './helpers.js'
import { getFile } from './api/file.js'
import { sendMessage, sendDocumentToThread } from './api/send-message.js'

export const handleCmd = async (command, message, botToken) => {
    const userId = message.from.id;

    switch (command) {
        case '/start':
        case '/set_pubkey':
            await setUserState(userId, STATE_WAIT_PUBKEY);
            sendMessage(botToken, userId, 'Pubkey ->');
            break;
         case '/verify':
            await setUserState(userId, STATE_WAIT_CONTENT);
            sendMessage(botToken, userId, 'Content ->');
            break;
        case '/state':
            sendMessage(botToken, userId, (await getUserState(userId)).value);
            break;
         case '/clear':
            await setUserState(userId, STATE_NOSTATE);
            sendMessage(botToken, userId, 'OK');
            break;
         default:
            sendMessage(botToken, userId, 'unknown command');
    }
}

export const handleState = async (message, botToken) => {
    const userId = message.from.id;
    const userState = await getUserState(userId);
    const document = message.document;

    switch (userState.value) {
        case STATE_WAIT_PUBKEY:
            if (document && document.mime_type === 'application/pgp-signature' && document.file_name.endsWith('.asc')) {
                const file = await getFile(botToken, document.file_id);
                await setUserCert(userId, file.toString());
                
                sendMessage(botToken, userId, "pubkey saved")
                sendDocumentToThread(botToken, process.env.GROUP_ID, process.env.CA_TOPIC_ID, document.file_id, `@${message.from.username}`)
                await setUserState(userId, STATE_NOSTATE);
            } else {
                sendMessage(botToken, userId, 'pubkey expected');
            }
            break;
         case STATE_WAIT_CONTENT:
            if (!message.text) {
                return sendMessage(botToken, userId, 'text content expected')
            }

            await setUserState(userId, STATE_WAIT_SIG, message.text);
            sendMessage(botToken, userId, 'Sig ->');
            break;
         case STATE_WAIT_SIG:
            if (document && document.mime_type === 'application/pgp-signature' && document.file_name.endsWith('.sig')) {
                const sigFile = await getFile(botToken, document.file_id);
                
                const pubkeys = await getAllCerts();

                if (await checkSig(userState.data, sigFile, pubkeys)) {
                    sendMessage(botToken, userId, "sig correct")
                } else {
                    sendMessage(botToken, userId, "sig incorrect")
                }
                
                await setUserState(userId, STATE_NOSTATE);
            } else {
                sendMessage(botToken, userId, 'sig expected');
            }
            break;
         default:
            sendMessage(botToken, userId, 'Use cmd');
    }
}
