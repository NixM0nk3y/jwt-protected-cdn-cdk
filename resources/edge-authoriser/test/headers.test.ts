import { CloudFrontHeaders } from "aws-lambda";
import { appendHeader, retrieveHeaderValue } from "../src/utils/headers";

describe("Header Tests", () => {
    test("Header Get", async () => {
        const headers: CloudFrontHeaders = {
            authorization: [
                {
                    key: "Authorization",
                    value: "wibble",
                },
            ],
        };
        const value = retrieveHeaderValue(headers, "Authorization");

        expect(value).toBeDefined();
        expect(value).toBe("wibble");
    });

    test("Header Get", async () => {
        const headers: CloudFrontHeaders = {
            authorization: [
                {
                    key: "Authorization",
                    value: "wibble",
                },
            ],
        };
        const value = retrieveHeaderValue(headers, "notExist");

        expect(value).toBeUndefined();
    });

    test("Header Put", async () => {
        const headers: CloudFrontHeaders = {
            authorization: [
                {
                    key: "Authorization",
                    value: "wibble",
                },
            ],
        };
        const newheader = appendHeader({}, "Authorization", "wibble");

        expect(newheader).toBeDefined();
        expect(newheader).toStrictEqual(headers);
    });

    test("Header Append", async () => {
        const originalHeaders: CloudFrontHeaders = {
            "x-test-header": [
                {
                    key: "X-Test-Header",
                    value: "wibble",
                },
            ],
        };
        const newHeader = appendHeader(originalHeaders, "X-Test-Header", "foo");
        expect(newHeader["x-test-header"].length).toEqual(2);
    });
});
