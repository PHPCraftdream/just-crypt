# just-crypt

[![CI](https://github.com/PHPCraftdream/just-crypt/actions/workflows/ci.yml/badge.svg)](https://github.com/PHPCraftdream/just-crypt/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/just-crypt.svg)](https://www.npmjs.com/package/just-crypt)
[![npm downloads](https://img.shields.io/npm/dm/just-crypt.svg)](https://www.npmjs.com/package/just-crypt)
[![License: MIT OR Apache-2.0](https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue.svg)](#license)

Small Node.js CLI and library for encrypting and decrypting strings with a password.

The format derives a 32-byte key with Argon2id, applies 999 rounds of AES-256-CTR, and protects the result with AES-256-GCM. Every encryption generates a fresh salt and IV.

## Requirements

- Node.js 18 or newer

## Install

```sh
npm install -g just-crypt
```

## CLI

```sh
just-crypt 'password' 'secret message'
just-decrypt 'password' '<base64 blob>'
```

The encrypt command joins all arguments after the password with a single space. Quote arguments that contain spaces.

## Library

```js
import { decrypt, encrypt } from 'just-crypt';

const blob = await encrypt('password', 'secret message');
const plaintext = await decrypt('password', blob);
```

`encrypt` returns a base64 string. `decrypt` throws when the password is wrong or the data is malformed or tampered with.

## Security notes

The CLI accepts the password as a command-line argument, which may be visible in shell history or process listings. Use the library API when that exposure is unacceptable.

The format is intended for password-based string encryption. It does not provide password recovery, key rotation, or secure password prompting.

## Performance

Key derivation uses 1 GiB of memory and encryption performs 999 inner AES-256-CTR rounds. These parameters are part of the format and make each operation intentionally resource-intensive.

## License

This project is dual-licensed. You may choose either license:

- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE))
- MIT License ([LICENSE](LICENSE))

SPDX-License-Identifier: MIT OR Apache-2.0
