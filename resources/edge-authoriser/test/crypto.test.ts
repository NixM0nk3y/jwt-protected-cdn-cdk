import {
    generatePkceCodeVerifier,
    generatePkceCodeChallenge,
    getNonceAndHash,
    validateNonce,
} from "../src/utils/crypto";

test("Generate Pkce Code Verifier", async () => {
    const result = await generatePkceCodeVerifier();
    expect(result).toBeDefined();
    expect(result.length).toBe(43);
});

test("Generate Pkce Code Verifier Non-Default Length", async () => {
    const length = 128;
    const result = await generatePkceCodeVerifier(length);
    expect(result).toBeDefined();
    expect(result.length).toBe(length);
});

test("Generate Pkce Code Challenge", async () => {
    const result = await generatePkceCodeChallenge("0ef3f60597c68b137446128ba1472cc31f1ba67c36e");
    expect(result).toBeDefined();
    expect(result).toBe("G_S1Oeb2Njb6_vFsum39aCPnmAZMG8RpyvEKu_92PyI");
});

test("Generate Nonce and Hash", async () => {
    const { nonce, hash } = await getNonceAndHash();
    expect(nonce).toBeDefined();
    expect(nonce.length).toBe(64);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64);
});

test("Validate Nonce", async () => {
    const { nonce, hash } = await getNonceAndHash();
    const result = await validateNonce(nonce, hash);
    expect(result).toBeDefined();
    expect(result).toBe(true);
});
