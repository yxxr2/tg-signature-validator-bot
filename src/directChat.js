import { getUserState, setUserState, setUserCert, getAllCerts, updateUserStateCustom } from './model/user.js'
import { STATE_WAIT_PUBKEY, STATE_NOSTATE, STATE_WAIT_VERIFY_DATA } from './model/const.js'
import { checkSig, isCertFile, isSigFile } from './helpers.js'
import { getFile } from './api/file.js'
import { sendMessage, sendDocument } from './api/message.js'

export const handleMessage = async (command, message, botToken) => {
    if (command) {
        handleCmd(command, message, botToken);
    } else {
        handleState(message, botToken);
    }
}

const verifySignatures = async (botToken, userState) => {
    const userStateData = userState.data;

    if (userStateData?.content && userStateData?.sigFiles?.length) {
        const pubkeys = await getAllCerts();
        const checkResult = await Promise.all(userStateData.sigFiles.map(async (file) => {
            const sigFile = await getFile(botToken, file.file_id);

            return checkSig(userStateData.content, sigFile, pubkeys);
        }));

        const messages = userStateData.sigFiles.reduce((messages, file, index) => {
            messages.push(`[${file.file_unique_id}] ${file.file_name}: ${checkResult[index] ? 'OK' : 'NOT OK'}`);
            return messages;
        }, []);

        return messages;
    }

    return null;
}

const handleCmd = async (command, message, botToken) => {
    const userId = message.from.id;

    switch (command) {
        case '/start':
        case '/set_pubkey':
            await setUserState(userId, STATE_WAIT_PUBKEY);
            sendMessage(botToken, userId, undefined, 'Pubkey ->');
            break;
         case '/verify':
            const userState = await getUserState(userId);
            
            if (userState.value === STATE_WAIT_VERIFY_DATA) {
                const messages = await verifySignatures(botToken, userState);
            
                if (messages) {
                    sendMessage(botToken, userId, undefined, messages.join('\n'));
                    await setUserState(userId, STATE_NOSTATE);
                } else {
                    sendMessage(botToken, userId, undefined, 'Content & Sigs ->');
                }
            } else {
                await setUserState(userId, STATE_WAIT_VERIFY_DATA, { content: '', sigFiles: [] });
                sendMessage(botToken, userId, undefined, 'Content & Sigs ->');
            }
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

const handleState = async (message, botToken) => {
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
         case STATE_WAIT_VERIFY_DATA:
            if (!message.text && !isSigFile(document)) {
                return sendMessage(botToken, userId, undefined, 'text content or sig expected')
            }

            const rules = {};

            if (message.text) {
                rules.$set = { 'state.data.content': message.text };
            }

            if (isSigFile(document)) {
                rules.$push = { 'state.data.sigFiles': document };
            }

            updateUserStateCustom(userId, rules);
            break;
         default:
            sendMessage(botToken, userId, undefined, 'Use cmd');
    }
}
