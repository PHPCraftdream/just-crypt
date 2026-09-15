import crypto from 'node:crypto';
import { deriveMasterKey, ARGON2_SALT_LEN } from './kdf.js';

// [version:1][argon2Salt:16][gcmIv:12][gcmAuthTag:16][ciphertext:N]
const VERSION = 1;
const GCM_IV_LEN = 12;
const GCM_TAG_LEN = 16;
const INNER_ROUNDS = 999;
const CTR_KEY_LEN = 32;
const CTR_IV_LEN = 16;

function hkdfRoundMaterial(masterKey, salt, info, length) {
    const raw = crypto.hkdfSync('sha256', masterKey, salt, info, length);
    return Buffer.from(raw);
}

function ctrRoundKeyIv(masterKey, salt, roundIndex) {
    const material = hkdfRoundMaterial(
        masterKey,
        salt,
        `jsut-crypt-ctr-round-${roundIndex}`,
        CTR_KEY_LEN + CTR_IV_LEN,
    );
    return { key: material.subarray(0, CTR_KEY_LEN), iv: material.subarray(CTR_KEY_LEN) };
}

function gcmKey(masterKey, salt) {
    return hkdfRoundMaterial(masterKey, salt, 'jsut-crypt-gcm-layer', 32);
}

function applyCtrCascade(buffer, masterKey, salt) {
    let current = buffer;
    for (let i = 1; i <= INNER_ROUNDS; i++) {
        const { key, iv } = ctrRoundKeyIv(masterKey, salt, i);
        const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
        current = Buffer.concat([cipher.update(current), cipher.final()]);
    }
    return current;
}

function reverseCtrCascade(buffer, masterKey, salt) {
    let current = buffer;
    for (let i = INNER_ROUNDS; i >= 1; i--) {
        const { key, iv } = ctrRoundKeyIv(masterKey, salt, i);
        const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
        current = Buffer.concat([decipher.update(current), decipher.final()]);
    }
    return current;
}

export async function encrypt(password, plaintext) {
    const salt = crypto.randomBytes(ARGON2_SALT_LEN);
    const masterKey = await deriveMasterKey(password, salt);
    const afterCascade = applyCtrCascade(Buffer.from(plaintext, 'utf8'), masterKey, salt);

    const iv = crypto.randomBytes(GCM_IV_LEN);
    const key = gcmKey(masterKey, salt);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(afterCascade), cipher.final()]);
    const tag = cipher.getAuthTag();

    const blob = Buffer.concat([Buffer.from([VERSION]), salt, iv, tag, ciphertext]);
    return blob.toString('base64');
}

export async function decrypt(password, blobBase64) {
    const blob = Buffer.from(blobBase64, 'base64');
    const minLen = 1 + ARGON2_SALT_LEN + GCM_IV_LEN + GCM_TAG_LEN;
    if (blob.length < minLen) {
        throw new Error('Malformed input: too short to be a just-crypt blob');
    }

    let offset = 0;
    const version = blob[offset]; offset += 1;
    if (version !== VERSION) {
        throw new Error(`Unsupported format version: ${version}`);
    }
    const salt = blob.subarray(offset, offset + ARGON2_SALT_LEN); offset += ARGON2_SALT_LEN;
    const iv = blob.subarray(offset, offset + GCM_IV_LEN); offset += GCM_IV_LEN;
    const tag = blob.subarray(offset, offset + GCM_TAG_LEN); offset += GCM_TAG_LEN;
    const ciphertext = blob.subarray(offset);

    const masterKey = await deriveMasterKey(password, salt);
    const key = gcmKey(masterKey, salt);

    let afterCascade;
    try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        afterCascade = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch {
        throw new Error('Decryption failed: wrong password or corrupted/tampered data');
    }

    const plaintext = reverseCtrCascade(afterCascade, masterKey, salt);
    return plaintext.toString('utf8');
}
