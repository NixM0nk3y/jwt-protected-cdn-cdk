import { logger } from "./utils/observability";
import { unAuthorizedResponse } from "./pages";
import { CloudFrontRequest, CloudFrontResultResponse } from "aws-lambda";
import { JwtRsaVerifier } from "aws-jwt-verify";
import { getBearerToken } from "./utils/general";

import { config } from "./config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let verifier: any;

// initialise our JWT validator
if (config.AUTH_ENABLED) {
    verifier = JwtRsaVerifier.create({
        issuer: config.ISSUER,
        audience: config.AUDIENCE,
        jwksUri: config.JWKS_URI,
        graceSeconds: config.AUTH_GRACE,
    });
}

export async function authoriseRequest(
    request: CloudFrontRequest,
): Promise<CloudFrontRequest | CloudFrontResultResponse> {
    logger.info("authorising request");

    try {
        const token = getBearerToken(request.headers);

        const payload = await verifier.verify(token);

        logger.info("token is valid. payload:", { payload: payload });

        return request;
    } catch (error) {
        logger.error("error attempting to authorise request", { message: (error as Error).message });
        return unAuthorizedResponse("", (error as Error).message);
    }
}
