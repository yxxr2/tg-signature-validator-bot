export const sendMessage = async (botToken, chatId, threadId, message, entities) => {
    const url = new URL(`https://api.telegram.org/bot${botToken}/sendMessage`);
    url.searchParams.set('chat_id', chatId);
    threadId && url.searchParams.set('message_thread_id', threadId);
    url.searchParams.set('text', message);
    entities && url.searchParams.set('entities', JSON.stringify(entities));

    return fetch(url.toString()).then(res => res.json());
}

export const sendDocument = async (botToken, chatId, threadId, fileId, caption) => {
    const url = new URL(`https://api.telegram.org/bot${botToken}/sendDocument`);
    url.searchParams.set('chat_id', chatId);
    threadId && url.searchParams.set('message_thread_id', threadId);
    url.searchParams.set('document', fileId);
    url.searchParams.set('caption', caption);

    return fetch(url.toString()).then(res => res.json());
}

export const setMessageReaction = async (botToken, chatId, messageId, emoji) => {
    const url = new URL(`https://api.telegram.org/bot${botToken}/setMessageReaction`);
    url.searchParams.set('chat_id', chatId);
    url.searchParams.set('message_id', messageId);
    url.searchParams.set('reaction', JSON.stringify([{ type: 'emoji', emoji }]));

    return fetch(url.toString()).then(res => res.json());
}

export const sendMediaGroup = async (botToken, chatId, threadId, fileIds, replyToMessageId) => {
    const url = new URL(`https://api.telegram.org/bot${botToken}/sendMediaGroup`);
    url.searchParams.set('chat_id', chatId);
    threadId && url.searchParams.set('message_thread_id', threadId);
    url.searchParams.set('media', JSON.stringify(fileIds.map(fileId => ({ type: 'document', media: fileId }))));
    replyToMessageId && url.searchParams.set('reply_parameters', JSON.stringify({ message_id: replyToMessageId }));

    return fetch(url.toString()).then(res => res.json());
}
