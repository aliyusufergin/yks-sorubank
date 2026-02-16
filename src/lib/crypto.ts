const STORAGE_KEY = "yks-sorubank-crypto-key";

async function getOrCreateKey(): Promise<CryptoKey> {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
        const jwk = JSON.parse(stored);
        return crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
    }

    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const jwk = await crypto.subtle.exportKey("jwk", key);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jwk));
    return key;
}

export async function encryptApiKey(plaintext: string): Promise<string> {
    if (!plaintext) return "";
    const key = await getOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

    const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined));
}

export async function decryptApiKey(encrypted: string): Promise<string> {
    if (!encrypted) return "";

    try {
        const key = await getOrCreateKey();
        const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
        return new TextDecoder().decode(decrypted);
    } catch {
        // Fallback: might be a plaintext key from before encryption was added
        return encrypted;
    }
}
