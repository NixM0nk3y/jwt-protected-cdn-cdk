import { RouterRequest, RouterResponse, RouterHandler } from "./types";

import { CloudFrontRequest, CloudFrontResultResponse } from "aws-lambda";

import { match } from "path-to-regexp";

export class Router {
    private routes: Route[] = [];
    private middleware: RouterHandler[] = [];

    use(...handlers: RouterHandler[]) {
        this.middleware.push(...handlers);
        return this;
    }

    connect(url: string, ...handlers: RouterHandler[]) {
        return this.register("CONNECT", url, handlers);
    }

    delete(url: string, ...handlers: RouterHandler[]) {
        return this.register("DELETE", url, handlers);
    }

    get(url: string, ...handlers: RouterHandler[]) {
        return this.register("GET", url, handlers);
    }

    head(url: string, ...handlers: RouterHandler[]) {
        return this.register("HEAD", url, handlers);
    }

    options(url: string, ...handlers: RouterHandler[]) {
        return this.register("OPTIONS", url, handlers);
    }

    patch(url: string, ...handlers: RouterHandler[]) {
        return this.register("PATCH", url, handlers);
    }

    post(url: string, ...handlers: RouterHandler[]) {
        return this.register("POST", url, handlers);
    }

    put(url: string, ...handlers: RouterHandler[]) {
        return this.register("PUT", url, handlers);
    }

    trace(url: string, ...handlers: RouterHandler[]) {
        return this.register("TRACE", url, handlers);
    }

    any(url: string, ...handlers: RouterHandler[]) {
        return this.register("*", url, handlers);
    }

    async handle<E>(request: CloudFrontRequest): Promise<CloudFrontResultResponse | CloudFrontRequest> {
        try {
            const req: RouterRequest<E> = {
                request,
                headers: request.headers,
                method: request.method,
                params: {},
                query: {},
                body: {},
            };

            const route = this.getRoute(req);
            if (!route) {
                return {
                    status: "404",
                    statusDescription: "Not Found",
                };
            }

            const res: RouterResponse = {
                headers: {},
            };

            const handler = this.compose([...this.middleware, ...route.handlers]);
            await handler(req, res);

            if (typeof res.body === "object") {
                res.body = JSON.stringify(res.body);
            }

            if (res.response) {
                return res.response;
            }

            return {
                status: res.status?.toString() || (res.body ? "200" : "204"),
                headers: res.headers,
                body: res.body,
            };
        } catch (err) {
            console.error(err);
            return {
                status: "500",
            };
        }
    }

    private register(method: string, url: string, handlers: RouterHandler[]) {
        this.routes.push(new Route(method, url, handlers));
        return this;
    }

    private getRoute(req: RouterRequest) {
        return this.routes.find((r) => {
            try {
                const params = r.match(req);
                req.params = params;
                return true;
            } catch (e) {
                return false;
            }
        });
    }

    private compose(handlers: RouterHandler[]) {
        const runner = async (req: RouterRequest, res: RouterResponse, prevIndex = -1, index = 0) => {
            if (index === prevIndex) {
                /* istanbul ignore next */
                throw new Error("next() called multiple times");
            }
            if (typeof handlers[index] === "function") {
                await handlers[index](req, res, async () => {
                    await runner(req, res, index, index + 1);
                });
            }
        };
        return runner;
    }
}

export class Route {
    private matchFunction: any;

    constructor(
        readonly method: string,
        readonly url: string,
        readonly handlers: RouterHandler[],
    ) {
        this.matchFunction = match(url);
    }

    match(req: RouterRequest): Record<string, string> {
        /* istanbul ignore next */
        if (![req.method, "*"].includes(this.method)) {
            throw new Error("methods don't match");
        }

        const routeMatch = this.matchFunction(req.request.uri);

        if (routeMatch == false) {
            throw new Error("url pattern doesn't match");
        }

        return routeMatch.params as Record<string, string>;
    }
}
