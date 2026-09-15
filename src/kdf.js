import { argon2id } from 'hash-wasm';

// Argon2id parameters are part of the blob format.
export const ARGON2_SALT_LEN = 16;
export const ARGON2_ITERATIONS = 2;
export const ARGON2_MEMORY_KIB = 1024 * 1024;
export const ARGON2_PARALLELISM = 1;
export const MASTER_KEY_LEN = 32;

export async function deriveMasterKey(password, salt) {
    const hash = await argon2id({
        password,
        salt,
        iterations: ARGON2_ITERATIONS,
        memorySize: ARGON2_MEMORY_KIB,
        parallelism: ARGON2_PARALLELISM,
        hashLength: MASTER_KEY_LEN,
        outputType: 'binary',
    });
    return Buffer.from(hash);
}
