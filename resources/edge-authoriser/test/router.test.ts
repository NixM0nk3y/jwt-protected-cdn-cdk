import { CloudFrontResponse } from "aws-lambda";
import { Route, Router } from "../src/router";
import { RouterHandler, RouterRequest, RouterResponse } from "../src/router/types";
import { CloudFrontResponseBody } from "./authoriser.test";
import { CloudFrontHeaders } from "aws-lambda";
import { jest } from "@jest/globals";

type TestResponse = {
    pathname: string;
    method: string;
    body: any;
};

type HandlerRegister = (url: string, ...handlers: RouterHandler[]) => void;

describe.each([
    { method: "connect", register: (r: any) => r.connect },
    { method: "delete", register: (r: any) => r.delete },
    { method: "get", register: (r: any) => r.get },
    { method: "head", register: (r: any) => r.head },
    { method: "options", register: (r: any) => r.options },
    { method: "patch", register: (r: any) => r.patch },
    { method: "post", register: (r: any) => r.post },
    { method: "put", register: (r: any) => r.put },
    { method: "trace", register: (r: any) => r.trace },
    { method: "any", register: (r: any) => r.any },
])("httpMethodHandlers: $method", ({ method, register }) => {
    test(`/${method}`, async () => {
        const router = new Router();

        const handlerReg: HandlerRegister = register(router).bind(router);

        handlerReg(`/${method}`, async (req, res) => {
            const pathname = req.request.uri;
            const method = req.method.toLowerCase();

            res.status = 200;
            res.body = {
                pathname,
                method,
            };
        });

        const res = (await router.handle({
            clientIp: "127.0.0.1",
            method: method.toUpperCase(),
            uri: `/${method}`,
            querystring: "",
            headers: {},
        })) as CloudFrontResponseBody;
        expect(res.status).toBe("200");

        const body: TestResponse = JSON.parse(res.body);
        expect(body.pathname).toEqual(`/${method}`);
        expect(body.method).toEqual(method);
    });
});

// eslint-disable-next-line @typescript-eslint/no-empty-function
const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

describe("Default Handlers", () => {
    beforeEach(() => {
        consoleSpy.mockClear();
    });

    test("204 Handler", async () => {
        const router = new Router();

        router.get("/", async (req: RouterRequest, res: RouterResponse) => {});

        const res = (await router.handle({
            clientIp: "127.0.0.1",
            method: "GET",
            uri: `/`,
            querystring: "",
            headers: {},
        })) as CloudFrontResponseBody;
        expect(res.status).toBe("204");
        expect(console.error).not.toHaveBeenCalled();
    });

    test("404 Handler", async () => {
        const router = new Router();

        router.get("/", async (req: RouterRequest, res: RouterResponse) => {
            res.status = 200;
            res.body = "FOUND";
        });

        const res = (await router.handle({
            clientIp: "127.0.0.1",
            method: "GET",
            uri: `/foobar`,
            querystring: "",
            headers: {},
        })) as CloudFrontResponseBody;
        expect(res.status).toBe("404");
        expect(console.error).not.toHaveBeenCalled();
    });

    test("500 Handler", async () => {
        const router = new Router();

        router.get("/", async (req: RouterRequest, res: RouterResponse) => {
            throw Error("BANG");
        });

        const res = (await router.handle({
            clientIp: "127.0.0.1",
            method: "GET",
            uri: `/`,
            querystring: "",
            headers: {},
        })) as CloudFrontResponseBody;
        expect(res.status).toBe("500");
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenLastCalledWith(Error("BANG"));
    });
});

describe.each([
    { name: "fail", headers: {}, expectedCode: "403" },
    {
        name: "pass",
        headers: {
            "X-Auth-Token": [
                {
                    key: "X-Auth-Token",
                    value: "secret",
                },
            ],
        },
        expectedCode: "200",
    },
])("customMiddleware: $name", ({ name, headers, expectedCode }) => {
    test(`${name}`, async () => {
        const router = new Router();
        router.use(async (req, res, next) => {
            let token = "";

            const tokenHeaders = req.headers["X-Auth-Token"] || [];

            tokenHeaders.forEach((item) => {
                if (item.key == "X-Auth-Token") {
                    token = item.value;
                }
            });

            if (token !== "secret") {
                res.status = 403;
                res.body = "no token";
                return;
            }
            await next();
        });

        router.get("/secrets", (req, res) => {
            res.body = { foo: "bar" };
            res.status = 200;
        });

        const res = (await router.handle({
            clientIp: "127.0.0.1",
            method: "GET",
            uri: "/secrets",
            querystring: "",
            headers: headers as CloudFrontHeaders,
        })) as CloudFrontResponse;
        expect(res.status).toEqual(expectedCode);
    });
});

describe.each([
    { method: "delete", route: "/foo/:id", path: "/foo/bar", params: { id: "bar" } },
    { method: "get", route: "/foo/:id", path: "/foo/bar", params: { id: "bar" } },
    { method: "head", route: "/foo/:id", path: "/foo/bar", params: { id: "bar" } },
    { method: "options", route: "/foo/:id", path: "/foo/bar", params: { id: "bar" } },
    { method: "post", route: "/foo/:id", path: "/foo/bar", params: { id: "bar" } },
])('route Match: "$method $route"', ({ method, route, path, params }) => {
    test(`${path}`, () => {
        const newroute = new Route(method, route, []);
        const parsedparams = newroute.match({
            request: {
                clientIp: "127.0.0.1",
                method: method.toUpperCase(),
                uri: path,
                querystring: "",
                headers: {},
            },
            method: method,
            params: {},
            query: {},
            headers: {},
            body: null,
        });
        expect(parsedparams).toEqual(params);
    });
});

describe.each([{ method: "get", route: "/foo/:id", path: "/foo/bar/baz", params: {} }])(
    'route noMatch: "$method $route"',
    ({ method, route, path, params }) => {
        test(`${path}`, () => {
            expect.assertions(1);
            try {
                const newroute = new Route(method, route, []);
                newroute.match({
                    request: {
                        clientIp: "127.0.0.1",
                        method: method.toUpperCase(),
                        uri: path,
                        querystring: "",
                        headers: {},
                    },
                    method: method,
                    params: {},
                    query: {},
                    headers: {},
                    body: null,
                });
            } catch (error) {
                expect((error as Error).message).toEqual("url pattern doesn't match");
            }
        });
    },
);
