const PBKDF2_ITERATIONS = 600_000;

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

function toBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
}

function fromBase64(b64: string): Uint8Array {
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Encrypt a plaintext string with a password using PBKDF2 + AES-GCM.
 * Returns base64-encoded encrypted data, salt, and IV.
 */
export async function encryptWithPassword(
    plaintext: string,
    password: string
): Promise<{ encrypted: string; salt: string; iv: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

    return {
        encrypted: toBase64(new Uint8Array(ciphertext)),
        salt: toBase64(salt),
        iv: toBase64(iv),
    };
}

/**
 * Decrypt a ciphertext with a password using PBKDF2 + AES-GCM.
 * Throws an error if the password is wrong (AES-GCM integrity check).
 */
export async function decryptWithPassword(
    encrypted: string,
    salt: string,
    iv: string,
    password: string
): Promise<string> {
    const key = await deriveKey(password, fromBase64(salt));
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromBase64(iv) as BufferSource },
        key,
        fromBase64(encrypted) as BufferSource
    );
    return new TextDecoder().decode(decrypted);
}
