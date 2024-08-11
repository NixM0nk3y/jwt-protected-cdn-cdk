import { lambdaHandler } from "../src/lambda";
import { context } from "./fixtures/lambdaContext";
import { CloudFrontRequestEvent, CloudFrontResultResponse } from "aws-lambda";

import {
    mockHttpsUri,
    generateKeyPair,
    disallowAllRealNetworkTraffic,
    allowAllRealNetworkTraffic,
    signJwt,
} from "./fixtures/jwt-util";

import versionevent from "./events/versionrequest.json";
import rootevent from "./events/rootrequest.json";
import optionsevent from "./events/rootoptions.json";

import versiondata from "../src/version.json";

export interface CloudFrontResponseBody extends CloudFrontResultResponse {
    body: string;
}

describe("Lambda Routing", () => {
    let keypair: ReturnType<typeof generateKeyPair>;

    function initApp(enabled: boolean) {
        process.env.AUTH_ENABLED = enabled ? "true" : "false";
        process.env.JWKS_URI = "https://example.com/path/to/jwks.json";
        process.env.ISSUER = "https://example.com";
        process.env.AUDIENCE = "1234,5678";
    }

    beforeAll(() => {
        keypair = generateKeyPair();
        disallowAllRealNetworkTraffic();
    });
    afterAll(() => {
        allowAllRealNetworkTraffic();
    });

    describe("Version Tests", () => {
        test("handler with /version endpoint", async () => {
            const e: CloudFrontRequestEvent = versionevent as CloudFrontRequestEvent;

            const result = await lambdaHandler(e, context);

            expect((result as CloudFrontResponseBody).status).toBeDefined();
            expect((result as CloudFrontResponseBody).status).toBe("200");
            const headers = (result as CloudFrontResponseBody)?.headers || {};
            expect(headers["Content-Type"][0].value).toBe("application/json");
            expect((result as CloudFrontResponseBody).body).toBe(JSON.stringify(versiondata));
        });
    });

    describe("Auth Tests", () => {
        const auth_enable = true;

        test("handler with / endpoint auth", async () => {
            initApp(auth_enable);
            const e: CloudFrontRequestEvent = rootevent as CloudFrontRequestEvent;

            const result = await lambdaHandler(e, context);
            expect(result).toBeDefined();
            expect((result as CloudFrontResponseBody).status).toBe("401");
        });

        test("handler with OPTIONs / with auth", async () => {
            initApp(auth_enable);
            const e: CloudFrontRequestEvent = optionsevent as CloudFrontRequestEvent;

            const result = await lambdaHandler(e, context);
            expect(result).toBeDefined();
            expect((result as CloudFrontResponseBody).status).toBeUndefined();
        });

        test("handler with / endpoint with basic auth", async () => {
            initApp(auth_enable);
            const e: CloudFrontRequestEvent = rootevent as CloudFrontRequestEvent;

            e.Records[0].cf.request.headers["authorization"] = [
                {
                    key: "authorization",
                    value: "Basic foo",
                },
            ];

            const result = await lambdaHandler(e, context);
            expect(result).toBeDefined();
            expect((result as CloudFrontResponseBody).status).toBe("401");
        });

        test("handler with / endpoint with bad bearer token", async () => {
            initApp(auth_enable);
            const e: CloudFrontRequestEvent = rootevent as CloudFrontRequestEvent;

            e.Records[0].cf.request.headers["authorization"] = [
                {
                    key: "authorization",
                    value: "Bearer foo.bar.wibble",
                },
            ];

            const result = await lambdaHandler(e, context);
            expect(result).toBeDefined();
            expect((result as CloudFrontResponseBody).status).toBe("401");
        });

        test("handler with / endpoint with good bearer token (mocked validate)", async () => {
            initApp(auth_enable);

            // generate our token
            const signedJwt = signJwt(
                { kid: keypair.jwk.kid },
                { aud: ["5678"], iss: "https://example.com" },
                keypair.privateKey,
            );

            // insert into our request
            const e: CloudFrontRequestEvent = rootevent as CloudFrontRequestEvent;
            e.Records[0].cf.request.headers["authorization"] = [
                {
                    key: "authorization",
                    value: `Bearer ${signedJwt}`,
                },
            ];

            // mock the endpoint
            mockHttpsUri("https://example.com/path/to/jwks.json", {
                responsePayload: JSON.stringify(keypair.jwks),
            });

            const result = await lambdaHandler(e, context);

            // confirm results
            expect(result).toBeDefined();
            expect((result as CloudFrontResponseBody).status).toBeUndefined();
        });

        test("handler with / endpoint with good bearer token - bad aud (mocked validate)", async () => {
            initApp(auth_enable);

            // generate our token
            const signedJwt = signJwt(
                { kid: keypair.jwk.kid },
                { aud: ["5678"], iss: "https://baddomain.com" },
                keypair.privateKey,
            );

            // insert into our request
            const e: CloudFrontRequestEvent = rootevent as CloudFrontRequestEvent;
            e.Records[0].cf.request.headers["authorization"] = [
                {
                    key: "authorization",
                    value: `Bearer ${signedJwt}`,
                },
            ];

            // mock the endpoint
            mockHttpsUri("https://example.com/path/to/jwks.json", {
                responsePayload: JSON.stringify(keypair.jwks),
            });

            const result = await lambdaHandler(e, context);

            // confirm results
            expect(result).toBeDefined();
            expect((result as CloudFrontResponseBody).status).toBe("401");
        });
    });

    describe("Non Auth Tests", () => {
        const auth_enable = false;

        test("handler with / endpoint", async () => {
            initApp(auth_enable);
            const e: CloudFrontRequestEvent = rootevent as CloudFrontRequestEvent;

            const result = await lambdaHandler(e, context);
            expect(result).toBeDefined();
            expect((result as CloudFrontResponseBody).status).toBeUndefined();
        });
    });
});
