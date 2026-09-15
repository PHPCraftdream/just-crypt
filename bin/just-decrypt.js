#!/usr/bin/env node
import { decrypt } from '../src/cipher.js';

function usageAndExit() {
    console.error('Usage: just-decrypt <pass> <string>');
    console.error('  <pass>   first argument; quote it if it contains spaces');
    console.error('  <string> base64 blob produced by just-crypt');
    process.exit(1);
}

const [, , pass, ...rest] = process.argv;

if (!pass || rest.length === 0) usageAndExit();

const blob = rest.join(' ');

try {
    const result = await decrypt(pass, blob);
    console.log(result);
} catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
}
