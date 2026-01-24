import path from 'path'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import * as openpgp from 'openpgp'

export const getCommand = (message) => {
    const cmdEntity = message.entities?.length ? message.entities.find(ent => ent.type === 'bot_command') : null;

    if (cmdEntity) {
        return message.text.slice(cmdEntity.offset, cmdEntity.offset + cmdEntity.length)
    }

    return null;
}

const saveFile = async (filePath, file) => {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, file);
}

export const savePubkey = async (userId, file) => {
    return saveFile(path.join('.pubkeys', `${userId}_pubkey.asc`), file);
}
export const loadPubkeys = async () => {
    const files = await readdir('.pubkeys');
    return Promise.all(files.map(file => readFile(path.join('.pubkeys', file), { encoding: 'utf8' })));
}

export const checkSig = async (message, signature, publicKeys) => {
    const verificationResult = await openpgp.verify({
        message: await openpgp.createMessage({ text: message }),
        signature: await openpgp.readSignature({ binarySignature: signature }),
        verificationKeys: await Promise.all(publicKeys.map(publicKey => openpgp.readKey({ armoredKey: publicKey })))
    });

    try {
        return await verificationResult.signatures[0].verified
    } catch {
        return false;
    }
}