
import { buffer } from 'node:stream/consumers'

export const makeApiCall = async (method, params = {}) => {
    const url = new URL(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/${method}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

    return fetch(url.toString()).then(res => res.json());
}

export const getFile = async (filePath) => {
    const file = await fetch(`https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`);

    return buffer(file.body);
}
