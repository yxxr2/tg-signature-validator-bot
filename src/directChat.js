import { getUserState, setUserState, setUserCert, getAllCerts, updateUserStateCustom } from './model/user.js'
import { STATE_WAIT_PUBKEY, STATE_NOSTATE, STATE_WAIT_VERIFY_DATA } from './model/const.js'
import { checkSig, isCertFile, isSigFile } from './helpers.js'
import { getFile } from './api/file.js'
import { sendMessage, sendDocument } from './api/message.js'

export const handleMessage = async (command, message) => {
    if (command) {
        await handleCmd(command, message);
    } else {
        await handleState(message);
    }
}

const verifySignatures = async (userState) => {
    const userStateData = userState.data;

    if (userStateData?.content && userStateData?.sigFiles?.length) {
        const pubkeys = await getAllCerts();
        const checkResult = await Promise.all(userStateData.sigFiles.map(async (file) => {
            const sigFile = await getFile(file.file_id);

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

const handleCmd = async (command, message) => {
    const userId = message.from.id;

    switch (command) {
        case '/start':
        case '/set_pubkey':
            await setUserState(userId, STATE_WAIT_PUBKEY);
            sendMessage(userId, undefined, 'Pubkey ->');
            break;
         case '/verify':
            const userState = await getUserState(userId);
            
            if (userState.value === STATE_WAIT_VERIFY_DATA) {
                const messages = await verifySignatures(userState);
            
                if (messages) {
                    sendMessage(userId, undefined, messages.join('\n'));
                    await setUserState(userId, STATE_NOSTATE);
                } else {
                    sendMessage(userId, undefined, 'Content & Sigs ->');
                }
            } else {
                await setUserState(userId, STATE_WAIT_VERIFY_DATA, { content: '', sigFiles: [] });
                sendMessage(userId, undefined, 'Content & Sigs ->');
            }
            break;
        case '/state':
            sendMessage(userId, undefined, (await getUserState(userId)).value);
            break;
         case '/clear':
            await setUserState(userId, STATE_NOSTATE);
            sendMessage(userId, undefined, 'OK');
            break;
         default:
            sendMessage(userId, undefined, 'unknown command');
    }
}

const handleState = async (message) => {
    const userId = message.from.id;
    const userState = await getUserState(userId);
    const document = message.document;

    switch (userState.value) {
        case STATE_WAIT_PUBKEY:
            if (isCertFile(document)) {
                const file = await getFile(document.file_id);
                await setUserCert(userId, file.toString());
                
                sendMessage(userId, undefined, "pubkey saved")
                sendDocument(process.env.CA_CHAT_ID, process.env.CA_TOPIC_ID, document.file_id, `@${message.from.username}`)
                await setUserState(userId, STATE_NOSTATE);
            } else {
                sendMessage(userId, undefined, 'pubkey expected');
            }
            break;
         case STATE_WAIT_VERIFY_DATA:
            if (!message.text && !isSigFile(document)) {
                return sendMessage(userId, undefined, 'text content or sig expected')
            }

            const rules = {};

            if (message.text) {
                rules.$set = { 'state.data.content': message.text };
            }

            if (isSigFile(document)) {
                rules.$push = { 'state.data.sigFiles': document };
            }

            await updateUserStateCustom(userId, rules);
            break;
         default:
            sendMessage(userId, undefined, 'Use cmd');
    }
}
