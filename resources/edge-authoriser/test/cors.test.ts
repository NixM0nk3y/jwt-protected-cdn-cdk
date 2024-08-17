import middy from "@middy/core";
import cors from "./../src/middy/corsmiddleware";

import { context } from "./fixtures/lambdaContext";
import { CloudFrontRequestEvent, CloudFrontResultResponse, Context, CloudFrontHeaders } from "aws-lambda";
import { disallowAllRealNetworkTraffic, allowAllRealNetworkTraffic } from "./fixtures/jwt-util";

import optionsevent from "./events/rootoptions.json";
import { retrieveHeaderValue } from "../src/utils/headers";

export interface CloudFrontResponseBody extends CloudFrontResultResponse {
    body: string;
}

type MapType = {
    [id: string]: string;
};

describe.each([
    { name: "get", verb: "GET", config: {}, expectedCode: "404", expectedHeaders: {} as MapType },
    {
        name: "preflight",
        verb: "OPTIONS",
        config: {
            origin: "*",
        },
        expectedCode: "204",
        expectedHeaders: {
            "access-control-allow-origin": "*",
        } as MapType,
    },
    {
        name: "preflight + creds",
        verb: "OPTIONS",
        config: {
            origin: "*",
            credentials: true,
        },
        expectedCode: "204",
        expectedHeaders: {
            "access-control-allow-origin": "https://origin.example.com",
        } as MapType,
    },
    {
        name: "no preflight",
        verb: "OPTIONS",
        config: {
            disableBeforePreflightResponse: true,
        },
        expectedCode: "404",
        expectedHeaders: {} as MapType,
    },
    {
        name: "custom methods",
        verb: "OPTIONS",
        config: {
            methods: "GET, HEAD",
            headers: "authorization",
        },
        expectedCode: "204",
        expectedHeaders: {
            "access-control-allow-methods": "GET, HEAD",
            "access-control-allow-headers": "authorization",
        } as MapType,
    },
    {
        name: "wildcard origin static",
        verb: "OPTIONS",
        config: {
            origins: ["*"],
            credentials: true,
        },
        expectedCode: "204",
        expectedHeaders: {
            "access-control-allow-origin": "https://origin.example.com",
        } as MapType,
    },
    {
        name: "wildcard origin static",
        verb: "OPTIONS",
        config: {
            origins: ["*"],
        },
        expectedCode: "204",
        expectedHeaders: {
            "access-control-allow-origin": "*",
        } as MapType,
    },
    {
        name: "custom origin static",
        verb: "OPTIONS",
        config: {
            origins: ["https://origin.example.com"],
        },
        expectedCode: "204",
        expectedHeaders: {
            "access-control-allow-origin": "https://origin.example.com",
        } as MapType,
    },
    {
        name: "custom origin any + credentials",
        verb: "OPTIONS",
        config: {
            credentials: true,
        },
        expectedCode: "204",
        expectedHeaders: {
            "access-control-allow-origin": "https://origin.example.com",
        } as MapType,
    },
    {
        name: "custom origin regex",
        verb: "OPTIONS",
        config: {
            origins: ["*.example.com"],
        },
        expectedCode: "204",
        expectedHeaders: {
            "access-control-allow-origin": "https://origin.example.com",
        } as MapType,
    },

    {
        name: "custom origin regex",
        verb: "OPTIONS",
        config: {
            exposeHeaders: "Accept",
            maxAge: 3600,
            requestHeaders: "Content-Type",
            requestMethods: "PUT",
            cacheControl: "max-age=604800",
        },
        expectedCode: "204",
        expectedHeaders: {
            "access-control-allow-origin": "*",
            "access-control-expose-headers": "Accept",
            "access-control-max-age": "3600",
            "access-control-request-headers": "Content-Type",
            "access-control-request-methods": "PUT",
            "cache-control": "max-age=604800",
        } as MapType,
    },
])("CORS Test:", ({ name, verb, config, expectedCode, expectedHeaders }) => {
    beforeAll(() => {
        disallowAllRealNetworkTraffic();
    });
    afterAll(() => {
        allowAllRealNetworkTraffic();
    });

    test(`${name}`, async () => {
        const e: CloudFrontRequestEvent = optionsevent as CloudFrontRequestEvent;

        e.Records[0].cf.request = {
            clientIp: "127.0.0.1",
            method: verb,
            uri: "/",
            querystring: "",
            headers: {
                origin: [
                    {
                        key: "origin",
                        value: "https://origin.example.com",
                    },
                ],
            },
        };

        const lambdaHandler = (e: CloudFrontRequestEvent, context: Context): CloudFrontResponseBody => {
            return {
                status: "404",
                statusDescription: "NOT FOUND",
                body: "NOT FOUND",
            };
        };

        const handler = middy().use(cors(config)).handler(lambdaHandler);

        const results = await handler(e, context);

        expect(results.status).toBe(expectedCode);

        for (const header in expectedHeaders) {
            const headers: CloudFrontHeaders = results.headers || {};
            expect(retrieveHeaderValue(headers, header)).toBe(expectedHeaders[header]);
        }
    });
});
