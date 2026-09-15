import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { decrypt, encrypt } from '../index.js';

const password = 'correct horse battery staple';

test('encrypt and decrypt round-trip text, including Unicode and empty input', async () => {
    const plaintext = '\u05e9\u05dc\u05d5\u05dd, \u043c\u0438\u0440, hello \u{1f30d}\nsecond line\0';
    const blob = await encrypt(password, plaintext);

    assert.match(blob, /^[A-Za-z0-9+/]+={0,2}$/);
    assert.equal(await decrypt(password, blob), plaintext);

    const emptyBlob = await encrypt(password, '');
    assert.equal(await decrypt(password, emptyBlob), '');
    assert.notEqual(blob, emptyBlob);
});

test('rejects a wrong password and malformed blobs', async () => {
    const blob = await encrypt(password, 'authenticated message');

    await assert.rejects(
        () => decrypt('wrong password', blob),
        { message: 'Decryption failed: wrong password or corrupted/tampered data' },
    );
    await assert.rejects(
        () => decrypt(password, 'x'),
        { message: 'Malformed input: too short to be a just-crypt blob' },
    );

    const unsupportedVersion = Buffer.alloc(45);
    unsupportedVersion[0] = 2;
    await assert.rejects(
        () => decrypt(password, unsupportedVersion.toString('base64')),
        { message: 'Unsupported format version: 2' },
    );
});

test('CLI reports usage when required arguments are missing', () => {
    for (const script of ['just-crypt.js', 'just-decrypt.js']) {
        const result = spawnSync(
            process.execPath,
            [fileURLToPath(new URL(`../bin/${script}`, import.meta.url))],
            { encoding: 'utf8' },
        );

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Usage: just-(?:crypt|decrypt) <pass> <string>/);
    }
});
