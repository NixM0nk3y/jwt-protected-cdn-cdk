import { getBearerToken } from "../src/utils/general";
import { CloudFrontHeaders } from "aws-lambda";

describe("Token Tests", () => {
    test("No Auth Header", async () => {
        expect.assertions(1);
        try {
            const headers: CloudFrontHeaders = {};
            await getBearerToken(headers);
        } catch (error) {
            expect((error as Error).message).toEqual("no auth header found");
        }
    });

    test("Basic Auth", async () => {
        expect.assertions(1);
        try {
            const headers: CloudFrontHeaders = {
                authorization: [
                    {
                        key: "Authorization",
                        value: "Basic dXNlcm5hbWU6cGFzc3dvcmQK",
                    },
                ],
            };
            await getBearerToken(headers);
        } catch (error) {
            expect((error as Error).message).toEqual("unsupported auth scheme");
        }
    });

    test("Empty Auth", async () => {
        expect.assertions(1);
        try {
            const headers: CloudFrontHeaders = {
                authorization: [
                    {
                        key: "Authorization",
                        value: "",
                    },
                ],
            };
            await getBearerToken(headers);
        } catch (error) {
            expect((error as Error).message).toEqual("no token found in authorization header");
        }
    });

    test("Bearer Auth", async () => {
        const sample_token = "foo.bar.wibble";
        const headers: CloudFrontHeaders = {
            authorization: [
                {
                    key: "Authorization",
                    value: `Bearer ${sample_token}`,
                },
            ],
        };
        const token = await getBearerToken(headers);

        expect(token).toBeDefined();
        expect(token).toBe(sample_token);
    });
});
