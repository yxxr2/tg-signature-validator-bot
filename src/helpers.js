import * as openpgp from 'openpgp'

export const getCommand = (message) => {
    let text = message.text;
    let entities = message.entities;

    if (!text) {
        text = message.caption;
        entities = message.caption_entities;
    }

    const cmdEntity = entities?.length ? entities.find(ent => ent.type === 'bot_command') : null;

    if (cmdEntity) {
        const command = text.slice(cmdEntity.offset, cmdEntity.offset + cmdEntity.length);
        return command.split('@')[0];
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
