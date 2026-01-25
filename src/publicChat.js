import { isSigFile, checkSig } from './helpers.js'
import { getUserCert } from './model/user.js'
import {
    addMessageSignature,
    removeMessageSignature,
    removeUserSignature,
    getMessageSignatures,
    setMessageSignatures,
    isUserSigned,
} from './model/messageSignature.js'
import { setMessageReaction, sendMessage, sendMediaGroup } from './api/message.js'
import { getChatMemberCount } from './api/chat.js'
import { getFile } from './api/file.js'

const SUCCESS_EMOJI = '👍';
const FAILURE_EMOJI = '👎';
const FORBIDDEN_EMOJI = '😡';

export const handleMessage = async (command, message, botToken) => {
    if (message.left_chat_member) {
        await removeUserSignature(message.chat.id, message.left_chat_member.id);
        return;
    }

    const contentMessage = message.reply_to_message;

    const userId = message.from.id;
    const chatId = message.chat.id;
    const threadId = message.message_thread_id;

    if (!contentMessage?.text) return;

    const contentMessageData = { chatId: contentMessage.chat.id, messageId: contentMessage.message_id };

    const getSignaturesData = async () => {
        let needSigCount = (await getChatMemberCount(botToken, chatId)).result - 1;
        let sigEntities = await getMessageSignatures(contentMessageData);

        const verifiedSigEntities = (await Promise.all(sigEntities.map(async (sigEntity) => {
            const sigFile = await getFile(botToken, sigEntity.sigFileId);
            const userCert = await getUserCert(sigEntity.userId);

            if (await checkSig(contentMessage.text, sigFile, [userCert])) {
                return sigEntity;
            } else {
                return false;
            }
        }))).filter(Boolean);
        await setMessageSignatures(contentMessageData, verifiedSigEntities);

        return { sigFileIds: verifiedSigEntities.map(({ sigFileId }) => sigFileId), needSigCount };
    }

    switch (command) {
        case '/sign':
            const document = message.document;

            if (!(await isUserSigned(contentMessageData, userId)) && isSigFile(document)) {
                const sigFile = await getFile(botToken, document.file_id);
                const userCert = await getUserCert(userId);
                let reaction;

                if (await checkSig(contentMessage.text, sigFile, [userCert])) {
                    await addMessageSignature(contentMessageData, userId, document.file_id, message.chat.id, message.message_id);
                    reaction = SUCCESS_EMOJI;
                } else {
                    reaction = FAILURE_EMOJI;
                }

                await setMessageReaction(botToken, chatId, message.message_id, reaction);
            } else {
                await setMessageReaction(botToken, chatId, message.message_id, FORBIDDEN_EMOJI);
            }
            break;
         case '/revoke':
            await removeMessageSignature(contentMessageData, userId);
            await setMessageReaction(botToken, chatId, message.message_id, SUCCESS_EMOJI);
            break;
         case '/publish':
            const { sigFileIds, needSigCount } = await getSignaturesData();

            if (sigFileIds.length === needSigCount) {
                const res = await sendMessage(botToken, process.env.PUBLISH_CHAT_ID, process.env.PUBLISH_TOPIC_ID, contentMessage.text, contentMessage.entities);
                const publishedMessage = res.result;
                await sendMediaGroup(botToken, process.env.PUBLISH_CHAT_ID, process.env.PUBLISH_TOPIC_ID, sigFileIds, publishedMessage.message_id);
                await setMessageReaction(botToken, chatId, message.message_id, SUCCESS_EMOJI);
            } else {
                await sendMessage(botToken, chatId, threadId, `${sigFileIds.length}/${needSigCount} sigs`);
            }
            break;
        case '/state':
            const sigData = await getSignaturesData();

            await sendMessage(botToken, chatId, threadId, `${sigData.sigFileIds.length}/${sigData.needSigCount} sigs`);
            break;
    }
}
