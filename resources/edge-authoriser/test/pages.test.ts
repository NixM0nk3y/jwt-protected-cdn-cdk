import { errorResponse, versionResponse, unAuthorizedResponse } from "../src/pages";

describe("Page Tests", () => {
    describe("errorResponse Page", () => {
        test("default error page", async () => {
            const result = await errorResponse();
            expect(result).toBeDefined();
            expect(result.status).toBe("500");
        });
    });

    describe("versionResponse Page", () => {
        test("default version page", async () => {
            const result = await versionResponse();
            expect(result).toBeDefined();
            expect(result.status).toBe("200");
        });
    });

    describe("unAuthorizedResponse Page", () => {
        test("default unauthed page", async () => {
            const result = await unAuthorizedResponse();
            expect(result).toBeDefined();
            expect(result.status).toBe("401");
        });

        test("default unauthed page - non defaults", async () => {
            const result = await unAuthorizedResponse("foo");
            expect(result).toBeDefined();
            expect(result.status).toBe("401");
            expect(result.body).toContain("foo");
        });
    });
});
