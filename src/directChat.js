import { getUserState, setUserState } from './state.js'
import { STATE_WAIT_PUBKEY, STATE_NOSTATE, STATE_WAIT_CONTENT, STATE_WAIT_SIG } from './const.js'
import { savePubkey, loadPubkeys, checkSig } from './helpers.js'
import { getFile } from './api/file.js'
import { sendMessage, sendDocumentToThread } from './api/send-message.js'

export const handleCmd = (command, message, botToken) => {
    const userId = message.from.id;

    switch (command) {
        case '/start':
        case '/set_pubkey':
            setUserState(userId, STATE_WAIT_PUBKEY);
            sendMessage(botToken, userId, 'Pubkey ->');
            break;
         case '/verify':
            setUserState(userId, STATE_WAIT_CONTENT);
            sendMessage(botToken, userId, 'Content ->');
            break;
        case '/state':
            sendMessage(botToken, userId, getUserState(userId).state);
            break;
         case '/clear':
            setUserState(userId, STATE_NOSTATE, null);
            sendMessage(botToken, userId, 'OK');
            break;
         default:
            sendMessage(botToken, userId, 'unknown command');
    }
}

export const handleState = async (message, botToken) => {
    const userId = message.from.id;
    const userState = getUserState(userId);
    const document = message.document;

    switch (userState.state) {
        case STATE_WAIT_PUBKEY:
            if (document && document.mime_type === 'application/pgp-signature' && document.file_name.endsWith('.asc')) {
                const file = await getFile(botToken, document.file_id);
                await savePubkey(userId, file);
                
                sendMessage(botToken, userId, "pubkey saved")
                sendDocumentToThread(botToken, process.env.GROUP_ID, process.env.CA_TOPIC_ID, document.file_id, `@${message.from.username}`)
                setUserState(userId, STATE_NOSTATE);
            } else {
                sendMessage(botToken, userId, 'pubkey expected');
            }
            break;
         case STATE_WAIT_CONTENT:
            if (!message.text) {
                return sendMessage(botToken, userId, 'text content expected')
            }

            setUserState(userId, STATE_WAIT_SIG, message.text);
            sendMessage(botToken, userId, 'Sig ->');
            break;
         case STATE_WAIT_SIG:
            if (document && document.mime_type === 'application/pgp-signature' && document.file_name.endsWith('.sig')) {
                const sigFile = await getFile(botToken, document.file_id);
                
                try {
                    const pubkeys = await loadPubkeys();

                    if (await checkSig(userState.data, sigFile, pubkeys)) {
                        sendMessage(botToken, userId, "sig correct")
                    } else {
                        sendMessage(botToken, userId, "sig incorrect")
                    }
                } catch {
                    sendMessage(botToken, userId, "no pubkey")
                }
                
                setUserState(userId, STATE_NOSTATE);
            } else {
                sendMessage(botToken, userId, 'sig expected');
            }
            break;
         default:
            sendMessage(botToken, userId, 'Use cmd');
    }
}
