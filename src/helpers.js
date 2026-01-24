import * as openpgp from 'openpgp'

export const getCommand = (message) => {
    const cmdEntity = message.entities?.length ? message.entities.find(ent => ent.type === 'bot_command') : null;

    if (cmdEntity) {
        return message.text.slice(cmdEntity.offset, cmdEntity.offset + cmdEntity.length)
    }

    return null;
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