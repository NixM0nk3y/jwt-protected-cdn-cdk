import { CloudFrontResultResponse } from "aws-lambda";
import { serialize } from "cookie";
import { getNonceAndHash } from "../utils/crypto";

export function oidcRedirectResponse(): CloudFrontResultResponse {
    const { nonce, hash } = getNonceAndHash();
    //config.AUTH_REQUEST.nonce = nonce;
    //config.AUTH_REQUEST.state = request.uri; // Redirect to Authorization Server

    const response: CloudFrontResultResponse = {
        status: "301",
        statusDescription: "Found",
        body: "Redirecting to OIDC provider",
        headers: {
            "Content-Type": [
                {
                    key: "Content-Type",
                    value: "text/html",
                },
            ],
            Location: [
                {
                    key: "Location",
                    value: "foo",
                    //value: `${discoveryDocument.authorization_endpoint}?${QueryString.stringify(config.AUTH_REQUEST)}`,
                },
            ],
            "Set-Cookie": [
                {
                    key: "Set-Cookie",
                    value: serialize("TOKEN", "", {
                        path: "/",
                        expires: new Date(1970, 1, 1, 0, 0, 0, 0),
                    }),
                },
                {
                    key: "Set-Cookie",
                    value: serialize("NONCE", hash, {
                        path: "/",
                        httpOnly: true,
                    }),
                },
            ],
        },
    };
    return response;
}
