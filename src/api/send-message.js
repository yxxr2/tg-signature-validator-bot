export const sendMessage = async (botToken, chatId, message) => {
    const url = new URL(`https://api.telegram.org/bot${botToken}/sendMessage`);
    url.searchParams.set('chat_id', chatId);
    url.searchParams.set('text', message);

    return fetch(url.toString()).then(res => res.json());
}

export const sendDocumentToThread = async (botToken, chatId, threadId, fileId, caption) => {
    const url = new URL(`https://api.telegram.org/bot${botToken}/sendDocument`);
    url.searchParams.set('chat_id', chatId);
    url.searchParams.set('message_thread_id', threadId);
    url.searchParams.set('document', fileId);
    url.searchParams.set('caption', caption);

    return fetch(url.toString()).then(res => res.json());
}