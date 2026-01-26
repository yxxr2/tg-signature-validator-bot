export const getMe = async () => {
    return fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getMe`).then(res => res.json());
}