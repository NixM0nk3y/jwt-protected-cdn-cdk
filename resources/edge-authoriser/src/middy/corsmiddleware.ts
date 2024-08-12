import { normalizeHttpResponse } from "@middy/util";
import {
    Context,
    CloudFrontRequestEvent,
    CloudFrontRequest,
    CloudFrontResultResponse,
    CloudFrontHeaders,
} from "aws-lambda";
import { appendHeader, retrieveHeaderValue } from "../utils/headers";

export type MiddyRequest = {
    event: CloudFrontRequestEvent;
    context: Context;
    response: CloudFrontResultResponse | CloudFrontRequest;
};

type CorsConfig = {
    disableBeforePreflightResponse?: boolean;
    getOrigin: (incomingOrigin: string | undefined, options: CorsConfig) => string | null;
    credentials?: boolean;
    headers?: string;
    methods?: string;
    origin: string;
    origins: string[];
    exposeHeaders?: string;
    maxAge?: string;
    requestHeaders?: string;
    requestMethods?: string;
    cacheControl?: string;
};

const defaults: CorsConfig = {
    disableBeforePreflightResponse: false,
    getOrigin: (): string | null => {
        /* istanbul ignore next */
        return null;
    },
    origin: "*",
    origins: [],
};

const httpCorsMiddleware = (opts = {}) => {
    let originAny = false;
    const originStatic: { [id: string]: boolean } = {};
    const originDynamic: RegExp[] = [];
    const getOrigin = (incomingOrigin: string | undefined, options: CorsConfig) => {
        if (incomingOrigin && options.origins.length > 0) {
            if (originStatic[incomingOrigin]) {
                return incomingOrigin;
            }
            if (originAny) {
                if (options.credentials) {
                    return incomingOrigin;
                } else {
                    return "*";
                }
            }
            if (originDynamic.some((regExp) => regExp.test(incomingOrigin))) {
                return incomingOrigin;
            }
            // TODO deprecate `else` in v6
        } else {
            if (incomingOrigin && options.credentials && options.origin === "*") {
                return incomingOrigin;
            }
            return options.origin;
        }
        /* istanbul ignore next */
        return null;
    };
    const options: CorsConfig = {
        ...defaults,
        getOrigin,
        ...opts,
    };

    for (const origin of options.origins ?? []) {
        // Static
        if (origin.indexOf("*") < 0) {
            originStatic[origin] = true;
            continue;
        }
        // All
        if (origin === "*") {
            originAny = true;
            continue;
        }
        // Dynamic
        // TODO: IDN -> puncycode not handled, add in if requested
        const regExpStr = origin.replaceAll(".", "\\.").replaceAll("*", "[^.]*");
        originDynamic.push(new RegExp(`^${regExpStr}$`));
    }

    const httpCorsMiddlewareBefore = async (request: MiddyRequest) => {
        if (options.disableBeforePreflightResponse) return;

        const method = request.event.Records[0].cf.request.method;
        if (method === "OPTIONS") {
            normalizeHttpResponse(request);
            const headers: CloudFrontHeaders = {};
            modifyHeaders(headers, options, request);
            request.response = {
                status: "204",
                headers: headers,
            };
            return request.response;
        }
    };
    return {
        before: httpCorsMiddlewareBefore,
    };
};

const modifyHeaders = (headers: CloudFrontHeaders, options: CorsConfig, request: MiddyRequest) => {
    const incomingOrigin = retrieveHeaderValue(request.event.Records[0].cf.request.headers, "Origin");
    const newOrigin = options.getOrigin(incomingOrigin, options);
    if (newOrigin) {
        headers = appendHeader(headers, "Access-Control-Allow-Origin", newOrigin);
    }

    if (options.credentials) {
        headers = appendHeader(headers, "Access-Control-Allow-Credentials", String(options.credentials));
    }
    if (options.headers) {
        headers = appendHeader(headers, "Access-Control-Allow-Headers", options.headers);
    }
    if (options.methods) {
        headers = appendHeader(headers, "Access-Control-Allow-Methods", options.methods);
    }
    if (options.exposeHeaders) {
        headers = appendHeader(headers, "Access-Control-Expose-Headers", options.exposeHeaders);
    }
    if (options.maxAge) {
        headers = appendHeader(headers, "Access-Control-Max-Age", String(options.maxAge));
    }
    if (options.requestHeaders) {
        headers = appendHeader(headers, "Access-Control-Request-Headers", options.requestHeaders);
    }
    if (options.requestMethods) {
        headers = appendHeader(headers, "Access-Control-Request-Methods", options.requestMethods);
    }
    const httpMethod = request.event.Records[0].cf.request.method;
    if (httpMethod === "OPTIONS" && options.cacheControl) {
        headers = appendHeader(headers, "Cache-Control", options.cacheControl);
    }
};

export default httpCorsMiddleware;
