import { CloudFrontHeaders } from "aws-lambda";

export const getBearerToken = (headers: CloudFrontHeaders): string => {
    // do we have a auth header
    if (!("authorization" in headers)) {
        throw new Error("no auth header found");
    }
    // try to extract bearer token
    const authorization = headers.authorization[0]?.value;
    if (authorization) {
        const [authstyle, token] = authorization.split(" ");
        if (authstyle.toLowerCase() == "bearer") {
            return token;
        } else {
            throw new Error("unsupported auth scheme");
        }
    } else {
        throw new Error("no token found in authorization header");
    }
};
