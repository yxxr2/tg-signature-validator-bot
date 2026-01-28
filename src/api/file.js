import { makeApiCall, getFile as getFileHelper } from './helpers.js'

export const getFile = async (fileId) => {
    const fileInfo = await makeApiCall('getFile', { file_id: fileId });
    const filePath = fileInfo.result.file_path;

    return getFileHelper(filePath);
}