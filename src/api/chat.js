export const getChatMemberCount = async (botToken, chatId) => {
    const url = new URL(`https://api.telegram.org/bot${botToken}/getChatMemberCount`);
    url.searchParams.set('chat_id', chatId);

    return fetch(url.toString()).then(res => res.json());
}