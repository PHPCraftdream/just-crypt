#!/usr/bin/env node
import { encrypt } from '../src/cipher.js';

function usageAndExit() {
    console.error('Usage: just-crypt <pass> <string>');
    console.error('  <pass>   first argument; quote it if it contains spaces');
    console.error('  <string> everything after it, joined with a single space');
    process.exit(1);
}

const [, , pass, ...rest] = process.argv;

if (!pass || rest.length === 0) usageAndExit();

const text = rest.join(' ');

try {
    const result = await encrypt(pass, text);
    console.log(result);
} catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
}
