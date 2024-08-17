import { lambdaHandler } from "../src/lambda";
import { context } from "./fixtures/lambdaContext";
import { CloudFrontRequestEvent, CloudFrontResultResponse } from "aws-lambda";
import { config } from "../src/config";

import {
    mockHttpsUri,
    generateKeyPair,
    disallowAllRealNetworkTraffic,
    allowAllRealNetworkTraffic,
    signJwt,
} from "./fixtures/jwt-util";

import versionevent from "./events/versionrequest.json";
import rootevent from "./events/rootrequest.json";

import versiondata from "../src/version.json";

export interface CloudFrontResponseBody extends CloudFrontResultResponse {
    body: string;
}

describe("Lambda Routing", () => {
    let keypair: ReturnType<typeof generateKeyPair>;

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
            expect(headers["content-type"][0].value).toBe("application/json");
            expect((result as CloudFrontResponseBody).body).toBe(JSON.stringify(versiondata));
        });
    });

    describe("Auth Tests", () => {
        test("handler with / endpoint auth", async () => {
            const e: CloudFrontRequestEvent = rootevent as CloudFrontRequestEvent;

            const result = await lambdaHandler(e, context);
            expect(result).toBeDefined();
            expect((result as CloudFrontResponseBody).status).toBe("401");
        });

        test("handler with / endpoint with basic auth", async () => {
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
        test("handler with / endpoint", async () => {
            config.AUTH_ENABLED = false;
            const e: CloudFrontRequestEvent = rootevent as CloudFrontRequestEvent;

            const result = await lambdaHandler(e, context);
            expect(result).toBeDefined();
            expect((result as CloudFrontResponseBody).status).toBeUndefined();
        });
    });
});
