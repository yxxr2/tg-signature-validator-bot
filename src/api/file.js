
import { buffer } from 'node:stream/consumers'

export const getFile = async (botToken, fileId) => {
    const fileInfo = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`).then(res => res.json());
    const filePath = fileInfo.result.file_path;

    const file = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
    return buffer(file.body);
}