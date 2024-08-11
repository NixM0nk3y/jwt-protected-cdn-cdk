import { randomBytes, createHmac, createHash, BinaryLike } from "crypto";
import base64url from "base64url";

// getNonceAndHash gets a nonce and hash.
export function getNonceAndHash() {
    const nonce = randomBytes(32).toString("hex");
    const hash = createHmac("sha256", nonce).digest("hex");
    return { nonce, hash };
}

// validateNonce validates a nonce.
export function validateNonce(nonce: string, hash: string) {
    const other = createHmac("sha256", nonce).digest("hex");
    return other === hash;
}

export function generatePkceCodeVerifier(size = 43) {
    return randomBytes(size).toString("hex").slice(0, size);
}

export function generatePkceCodeChallenge(codeVerifier: BinaryLike) {
    const hash = createHash("sha256").update(codeVerifier).digest();
    return base64url.encode(hash);
}
