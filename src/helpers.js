import * as openpgp from 'openpgp'

export class CommandError extends Error {}
export const getCommand = (message, botInfo) => {
    let text = message.text;
    let entities = message.entities;

    if (!text) {
        text = message.caption;
        entities = message.caption_entities;
    }

    const cmdEntity = entities?.length ? entities.find(ent => ent.type === 'bot_command') : null;

    if (cmdEntity) {
        const commandEntity = text.slice(cmdEntity.offset, cmdEntity.offset + cmdEntity.length);
        const [command, username] = commandEntity.split('@');

        if (username) {
            if (username === botInfo.username) {
                return command;
            }

            throw new CommandError();
        }
 
        return command;
    }

    return null;
}

export const checkSig = async (message, signature, publicKeys) => {
    try {
        const verificationResult = await openpgp.verify({
            message: await openpgp.createMessage({ text: message }),
            signature: await openpgp.readSignature({ binarySignature: signature }),
            verificationKeys: await Promise.all(publicKeys.map(publicKey => openpgp.readKey({ armoredKey: publicKey })))
        });

        return await verificationResult.signatures[0].verified
    } catch {
        return false;
    }
}

export const isCertFile = (document) => document && document.mime_type === 'application/pgp-signature' && document.file_name.endsWith('.asc');
export const isSigFile = (document) => document && document.mime_type === 'application/pgp-signature' && document.file_name.endsWith('.sig');

export const getAsyncQueueByKey = () => {
    const queue = {};

    return (key, asyncFn) => {
        if (!queue[key]) {
            queue[key] = Promise.resolve();
        }

        const newPromise = queue[key].then(async () => {
            await asyncFn();

            if (queue[key] === newPromise) {
                delete queue[key];
            }
        });
        queue[key] = newPromise;
    }
}